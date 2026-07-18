# Parking

```c++
#include "mainwindow.h"
#include "./ui_mainwindow.h"
#include <QUrlQuery>
#include <QMessageBox>
#include <QFile>
#include <QBuffer>
#include <QDebug>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent), ui(new Ui::MainWindow),
    m_netMgr(new QNetworkAccessManager(this))
{
    ui->setupUi(this);

    // 绑定网络请求完成信号，所有http请求都会进这个函数处理返回数据
    connect(m_netMgr, &QNetworkAccessManager::finished,
            this, &MainWindow::onNetReplyFinished);

    // 初始化变量
    m_filePath = "";
    m_accessToken = "";
}

MainWindow::~MainWindow()
{
    delete ui;
}

// =====================1.【选择图片按钮】点击函数=====================
void MainWindow::on_btn_openImg_clicked()
{
    // 弹出文件选择框，只允许选择图片
    QString selectPath = QFileDialog::getOpenFileName(
        this,
        tr("请选择车牌图片"),
        QDir::homePath(),
        tr("图片文件 (*.jpg *.jpeg *.png *.bmp)")
        );

    // 如果没选文件直接返回
    if(selectPath.isEmpty())
        return;

    // 保存图片路径到全局变量
    m_filePath = selectPath;

    // 加载图片
    QImage img(m_filePath);
    if(img.isNull())
    {
        QMessageBox::warning(this, "图片错误", "图片损坏或格式不支持！");
        m_filePath = "";
        return;
    }

    // 图片缩放显示到label_img，保持比例居中
    ui->label_img->setPixmap(QPixmap::fromImage(img).scaled(
        ui->label_img->size(), Qt::KeepAspectRatio, Qt::SmoothTransformation
        ));

    // 清空上次识别结果，给出提示
    ui->plainText_result->setPlainText("图片加载完成，请点击【开始识别车牌】");
}

// =====================2.【开始识别按钮】点击函数=====================
void MainWindow::on_btn_recognize_clicked()
{
    if(m_filePath.isEmpty())
    {
        QMessageBox::information(this, "提示", "请先选择一张车牌图片！");
        return;
    }

    // 1. 无token先获取token
    if(m_accessToken.isEmpty())
    {
        ui->plainText_result->appendPlainText("\n正在向百度服务器获取鉴权令牌...");
        getAccessToken();
    }
    else
    {
        // 2. 有token直接组装base64调用识别，和官方示例调用顺序完全一致
        QString base64Str = imgToBase64(m_filePath);
        if(base64Str.isEmpty())
        {
            ui->plainText_result->appendPlainText("图片编码失败，终止识别");
            return;
        }
        sendOCRRequest(base64Str);
    }
}

// =====================3. 获取百度鉴权access_token（标准OAuth2逻辑）=====================
void MainWindow::getAccessToken()
{
    ui->plainText_result->appendPlainText("【调试】发起Token获取请求");
    QUrl tokenUrl("https://aip.baidubce.com/oauth/2.0/token");
    QUrlQuery params;
    params.addQueryItem("grant_type", "client_credentials");
    params.addQueryItem("client_id", API_KEY);
    params.addQueryItem("client_secret", SECRET_KEY);
    tokenUrl.setQuery(params);

    QNetworkRequest request(tokenUrl);
    // 增加请求超时，防止永久卡死
    m_netMgr->get(request);
    ui->plainText_result->appendPlainText("【调试】Token GET请求已发出，等待应答...");
}

QString MainWindow::imgToBase64(const QString& filePath)
{
    QFile file(filePath);
    if(!file.open(QIODevice::ReadOnly))
    {
        QString err = "图片读取失败，路径含中文/文件损坏：" + filePath;
        ui->plainText_result->appendPlainText(err);
        qDebug() << err;
        return "";
    }
    QByteArray fileData = file.readAll();
    file.close();
    qDebug() << "图片二进制大小(字节)：" << fileData.size();
    if(fileData.isEmpty())
    {
        ui->plainText_result->appendPlainText("错误：图片数据为空，无法上传识别");
        return "";
    }
    return fileData.toBase64();
}

void MainWindow::onNetReplyFinished(QNetworkReply *reply)
{
    m_isRequestingToken = false;
    // 一次性读取全部返回数据，不再调用seek
    QByteArray rawData = reply->readAll();
    qDebug() << "百度完整返回JSON：" << rawData;

    reply->deleteLater();
    // 网络底层错误拦截
    if(reply->error() != QNetworkReply::NoError)
    {
        QString errInfo = QString("网络错误码%1：%2").arg(reply->error()).arg(reply->errorString());
        ui->plainText_result->appendPlainText(errInfo);
        return;
    }

    QJsonDocument jsonDoc = QJsonDocument::fromJson(rawData);
    QJsonObject jsonObj = jsonDoc.object();

    // 分支1：Token接口返回（获取access_token）
    if(jsonObj.contains("access_token"))
    {
        m_accessToken = jsonObj["access_token"].toString();
        ui->plainText_result->appendPlainText("令牌获取成功，调用车牌识别接口");
        qDebug() << "成功拿到token：" << m_accessToken;

        // 读取图片转base64，发起识别请求
        QString base64Str = imgToBase64(m_filePath);
        qDebug() << "图片Base64字符串长度：" << base64Str.size();
        if(base64Str.isEmpty())
        {
            ui->plainText_result->appendPlainText("图片读取失败，无法识别");
            return;
        }
        sendOCRRequest(base64Str);
        return;
    }

    // 分支2：识别接口返回百度业务错误码
    if(jsonObj.contains("error_code"))
    {
        QString errCode = jsonObj["error_code"].toString();
        QString errMsg = jsonObj["error_msg"].toString();
        QString fullErr = QString("百度接口报错[%1]：%2").arg(errCode, errMsg);
        ui->plainText_result->appendPlainText(fullErr);
        return;
    }

    // 分支3：正常识别结果解析
    if(jsonObj.contains("words_result"))
    {
        QJsonArray plateArray = jsonObj["words_result"].toArray();
        QString printResult = "====================识别完成====================\n";
        for(auto plateItem : plateArray)
        {
            QJsonObject plateObj = plateItem.toObject();
            printResult += QString("车牌号码：%1\n").arg(plateObj["number"].toString());
            printResult += QString("车牌颜色：%1\n").arg(plateObj["color"].toString());
            printResult += "----------------------------------------\n";
        }
        ui->plainText_result->setPlainText(printResult);
    }
}

void MainWindow::sendOCRRequest(const QString& base64Img)
{
    QString ocrUrlStr = "https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate?access_token=" + m_accessToken;
    QUrl ocrUrl(ocrUrlStr);

    // 手动URL编码base64，替换3个关键符号
    QString safeBase64 = base64Img;
    safeBase64.replace("+", "%2B");
    safeBase64.replace("/", "%2F");
    safeBase64.replace("=", "%3D");

    QUrlQuery postBody;
    postBody.addQueryItem("image", safeBase64);
    postBody.addQueryItem("multi_detect", "true");
    postBody.addQueryItem("detect_complete", "false");
    postBody.addQueryItem("detect_risk", "false");

    QByteArray postData = postBody.toString(QUrl::FullyEncoded).toUtf8();
    QNetworkRequest request(ocrUrl);
    request.setRawHeader("Content-Type", "application/x-www-form-urlencoded");
    m_netMgr->post(request, postData);
    ui->plainText_result->appendPlainText("开始识别图片车牌...");
}


```

```c++
#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QFileDialog>
#include <QImage>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>

QT_BEGIN_NAMESPACE
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT
public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

    // 按钮槽函数声明
private slots:
    void on_btn_openImg_clicked();
    void on_btn_recognize_clicked();
    // 网络回调函数声明（修复第一条红线onNetReplyFinished不存在）
    void onNetReplyFinished(QNetworkReply* reply);

    // 私有工具函数声明（修复所有“未定义标识符”报错）
private:
    void getAccessToken();
    QString imgToBase64(const QString& filePath);
    void sendOCRRequest(const QString& base64Img);

    // 成员变量
private:
    Ui::MainWindow *ui;
    QNetworkAccessManager* m_netMgr;
    QString m_filePath;
    QString m_accessToken;
    bool m_isRequestingToken = false;

    // 替换成你自己的百度密钥
    const QString API_KEY = "rNOSKa9kyUmcfCh1Hn0OGfjm";
    const QString SECRET_KEY = "1YClwCihBeYfI2BgQHVk9WW2Vegj8PWH";
};

#endif // MAINWINDOW_H
```

