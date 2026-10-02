const n=`# Parking\r
\r
\`\`\`c++\r
#include "mainwindow.h"\r
#include "./ui_mainwindow.h"\r
#include <QUrlQuery>\r
#include <QMessageBox>\r
#include <QFile>\r
#include <QBuffer>\r
#include <QDebug>\r
\r
MainWindow::MainWindow(QWidget *parent)\r
    : QMainWindow(parent), ui(new Ui::MainWindow),\r
    m_netMgr(new QNetworkAccessManager(this))\r
{\r
    ui->setupUi(this);\r
\r
    // 绑定网络请求完成信号，所有http请求都会进这个函数处理返回数据\r
    connect(m_netMgr, &QNetworkAccessManager::finished,\r
            this, &MainWindow::onNetReplyFinished);\r
\r
    // 初始化变量\r
    m_filePath = "";\r
    m_accessToken = "";\r
}\r
\r
MainWindow::~MainWindow()\r
{\r
    delete ui;\r
}\r
\r
// =====================1.【选择图片按钮】点击函数=====================\r
void MainWindow::on_btn_openImg_clicked()\r
{\r
    // 弹出文件选择框，只允许选择图片\r
    QString selectPath = QFileDialog::getOpenFileName(\r
        this,\r
        tr("请选择车牌图片"),\r
        QDir::homePath(),\r
        tr("图片文件 (*.jpg *.jpeg *.png *.bmp)")\r
        );\r
\r
    // 如果没选文件直接返回\r
    if(selectPath.isEmpty())\r
        return;\r
\r
    // 保存图片路径到全局变量\r
    m_filePath = selectPath;\r
\r
    // 加载图片\r
    QImage img(m_filePath);\r
    if(img.isNull())\r
    {\r
        QMessageBox::warning(this, "图片错误", "图片损坏或格式不支持！");\r
        m_filePath = "";\r
        return;\r
    }\r
\r
    // 图片缩放显示到label_img，保持比例居中\r
    ui->label_img->setPixmap(QPixmap::fromImage(img).scaled(\r
        ui->label_img->size(), Qt::KeepAspectRatio, Qt::SmoothTransformation\r
        ));\r
\r
    // 清空上次识别结果，给出提示\r
    ui->plainText_result->setPlainText("图片加载完成，请点击【开始识别车牌】");\r
}\r
\r
// =====================2.【开始识别按钮】点击函数=====================\r
void MainWindow::on_btn_recognize_clicked()\r
{\r
    if(m_filePath.isEmpty())\r
    {\r
        QMessageBox::information(this, "提示", "请先选择一张车牌图片！");\r
        return;\r
    }\r
\r
    // 1. 无token先获取token\r
    if(m_accessToken.isEmpty())\r
    {\r
        ui->plainText_result->appendPlainText("\\n正在向百度服务器获取鉴权令牌...");\r
        getAccessToken();\r
    }\r
    else\r
    {\r
        // 2. 有token直接组装base64调用识别，和官方示例调用顺序完全一致\r
        QString base64Str = imgToBase64(m_filePath);\r
        if(base64Str.isEmpty())\r
        {\r
            ui->plainText_result->appendPlainText("图片编码失败，终止识别");\r
            return;\r
        }\r
        sendOCRRequest(base64Str);\r
    }\r
}\r
\r
// =====================3. 获取百度鉴权access_token（标准OAuth2逻辑）=====================\r
void MainWindow::getAccessToken()\r
{\r
    ui->plainText_result->appendPlainText("【调试】发起Token获取请求");\r
    QUrl tokenUrl("https://aip.baidubce.com/oauth/2.0/token");\r
    QUrlQuery params;\r
    params.addQueryItem("grant_type", "client_credentials");\r
    params.addQueryItem("client_id", API_KEY);\r
    params.addQueryItem("client_secret", SECRET_KEY);\r
    tokenUrl.setQuery(params);\r
\r
    QNetworkRequest request(tokenUrl);\r
    // 增加请求超时，防止永久卡死\r
    m_netMgr->get(request);\r
    ui->plainText_result->appendPlainText("【调试】Token GET请求已发出，等待应答...");\r
}\r
\r
QString MainWindow::imgToBase64(const QString& filePath)\r
{\r
    QFile file(filePath);\r
    if(!file.open(QIODevice::ReadOnly))\r
    {\r
        QString err = "图片读取失败，路径含中文/文件损坏：" + filePath;\r
        ui->plainText_result->appendPlainText(err);\r
        qDebug() << err;\r
        return "";\r
    }\r
    QByteArray fileData = file.readAll();\r
    file.close();\r
    qDebug() << "图片二进制大小(字节)：" << fileData.size();\r
    if(fileData.isEmpty())\r
    {\r
        ui->plainText_result->appendPlainText("错误：图片数据为空，无法上传识别");\r
        return "";\r
    }\r
    return fileData.toBase64();\r
}\r
\r
void MainWindow::onNetReplyFinished(QNetworkReply *reply)\r
{\r
    m_isRequestingToken = false;\r
    // 一次性读取全部返回数据，不再调用seek\r
    QByteArray rawData = reply->readAll();\r
    qDebug() << "百度完整返回JSON：" << rawData;\r
\r
    reply->deleteLater();\r
    // 网络底层错误拦截\r
    if(reply->error() != QNetworkReply::NoError)\r
    {\r
        QString errInfo = QString("网络错误码%1：%2").arg(reply->error()).arg(reply->errorString());\r
        ui->plainText_result->appendPlainText(errInfo);\r
        return;\r
    }\r
\r
    QJsonDocument jsonDoc = QJsonDocument::fromJson(rawData);\r
    QJsonObject jsonObj = jsonDoc.object();\r
\r
    // 分支1：Token接口返回（获取access_token）\r
    if(jsonObj.contains("access_token"))\r
    {\r
        m_accessToken = jsonObj["access_token"].toString();\r
        ui->plainText_result->appendPlainText("令牌获取成功，调用车牌识别接口");\r
        qDebug() << "成功拿到token：" << m_accessToken;\r
\r
        // 读取图片转base64，发起识别请求\r
        QString base64Str = imgToBase64(m_filePath);\r
        qDebug() << "图片Base64字符串长度：" << base64Str.size();\r
        if(base64Str.isEmpty())\r
        {\r
            ui->plainText_result->appendPlainText("图片读取失败，无法识别");\r
            return;\r
        }\r
        sendOCRRequest(base64Str);\r
        return;\r
    }\r
\r
    // 分支2：识别接口返回百度业务错误码\r
    if(jsonObj.contains("error_code"))\r
    {\r
        QString errCode = jsonObj["error_code"].toString();\r
        QString errMsg = jsonObj["error_msg"].toString();\r
        QString fullErr = QString("百度接口报错[%1]：%2").arg(errCode, errMsg);\r
        ui->plainText_result->appendPlainText(fullErr);\r
        return;\r
    }\r
\r
    // 分支3：正常识别结果解析\r
    if(jsonObj.contains("words_result"))\r
    {\r
        QJsonArray plateArray = jsonObj["words_result"].toArray();\r
        QString printResult = "====================识别完成====================\\n";\r
        for(auto plateItem : plateArray)\r
        {\r
            QJsonObject plateObj = plateItem.toObject();\r
            printResult += QString("车牌号码：%1\\n").arg(plateObj["number"].toString());\r
            printResult += QString("车牌颜色：%1\\n").arg(plateObj["color"].toString());\r
            printResult += "----------------------------------------\\n";\r
        }\r
        ui->plainText_result->setPlainText(printResult);\r
    }\r
}\r
\r
void MainWindow::sendOCRRequest(const QString& base64Img)\r
{\r
    QString ocrUrlStr = "https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate?access_token=" + m_accessToken;\r
    QUrl ocrUrl(ocrUrlStr);\r
\r
    // 手动URL编码base64，替换3个关键符号\r
    QString safeBase64 = base64Img;\r
    safeBase64.replace("+", "%2B");\r
    safeBase64.replace("/", "%2F");\r
    safeBase64.replace("=", "%3D");\r
\r
    QUrlQuery postBody;\r
    postBody.addQueryItem("image", safeBase64);\r
    postBody.addQueryItem("multi_detect", "true");\r
    postBody.addQueryItem("detect_complete", "false");\r
    postBody.addQueryItem("detect_risk", "false");\r
\r
    QByteArray postData = postBody.toString(QUrl::FullyEncoded).toUtf8();\r
    QNetworkRequest request(ocrUrl);\r
    request.setRawHeader("Content-Type", "application/x-www-form-urlencoded");\r
    m_netMgr->post(request, postData);\r
    ui->plainText_result->appendPlainText("开始识别图片车牌...");\r
}\r
\r
\r
\`\`\`\r
\r
\`\`\`c++\r
#ifndef MAINWINDOW_H\r
#define MAINWINDOW_H\r
\r
#include <QMainWindow>\r
#include <QNetworkAccessManager>\r
#include <QNetworkRequest>\r
#include <QNetworkReply>\r
#include <QFileDialog>\r
#include <QImage>\r
#include <QJsonDocument>\r
#include <QJsonObject>\r
#include <QJsonArray>\r
\r
QT_BEGIN_NAMESPACE\r
namespace Ui { class MainWindow; }\r
QT_END_NAMESPACE\r
\r
class MainWindow : public QMainWindow\r
{\r
    Q_OBJECT\r
public:\r
    MainWindow(QWidget *parent = nullptr);\r
    ~MainWindow() override;\r
\r
    // 按钮槽函数声明\r
private slots:\r
    void on_btn_openImg_clicked();\r
    void on_btn_recognize_clicked();\r
    // 网络回调函数声明（修复第一条红线onNetReplyFinished不存在）\r
    void onNetReplyFinished(QNetworkReply* reply);\r
\r
    // 私有工具函数声明（修复所有“未定义标识符”报错）\r
private:\r
    void getAccessToken();\r
    QString imgToBase64(const QString& filePath);\r
    void sendOCRRequest(const QString& base64Img);\r
\r
    // 成员变量\r
private:\r
    Ui::MainWindow *ui;\r
    QNetworkAccessManager* m_netMgr;\r
    QString m_filePath;\r
    QString m_accessToken;\r
    bool m_isRequestingToken = false;\r
\r
    // 替换成你自己的百度密钥\r
    const QString API_KEY = "rNOSKa9kyUmcfCh1Hn0OGfjm";\r
    const QString SECRET_KEY = "1YClwCihBeYfI2BgQHVk9WW2Vegj8PWH";\r
};\r
\r
#endif // MAINWINDOW_H\r
\`\`\`\r
\r
`;export{n as default};
