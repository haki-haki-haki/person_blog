const r=`# Qt调用百度API进行操作\r
\r
## CMakeLists.txt配置\r
\r
### find_package 追加 Network 组件\r
\r
\`find_package(Qt\${QT_VERSION_MAJOR} REQUIRED COMPONENTS Widgets Network)\`\r
\r
\`Network\` 是 Qt 网络模块，提供 \`QNetworkAccessManager\`、\`QNetworkRequest\`、\`QNetworkReply\` 等类；\r
\r
### 链接库追加 Qt Network\r
\r
\`target_link_libraries(mycar_identify PRIVATE Qt\${QT_VERSION_MAJOR}::Widgets Qt\${QT_VERSION_MAJOR}::Network)\`\r
\r
编译时把 Qt Network 库链接进你的可执行程序；\r
\r
\r
\r
## include相关库文件\r
\r
### 网络相关头文件\r
\r
\`\`\`c++\r
/ ========== 网络相关头文件（调用百度AI核心）==========\r
// 网络请求管理器，全局唯一，负责发GET/POST网络请求\r
#include <QNetworkAccessManager>\r
// 封装一条HTTP请求（地址、请求头、参数）\r
#include <QNetworkRequest>\r
// 单次请求的应答对象，存放服务器返回数据、错误信息\r
#include <QNetworkReply>\r
\r
\`\`\`\r
\r
### 文件图片弹窗控件头文件\r
\r
\`\`\`c++\r
// ========== 文件、图片、弹窗控件 ==========\r
// 文件选择对话框：打开本地图片用\r
#include <QFileDialog>\r
// 图片类：加载本地图片、缩放显示、转二进制\r
#include <QImage>\r
// 弹窗提示（警告、信息弹窗），代码里QMessageBox依赖这个，你现在头文件没加，后面要补上\r
#include <QMessageBox>\r
// 文件读写类，读取图片二进制\r
#include <QFile>\r
// 调试打印输出\r
#include <QDebug>\r
\`\`\`\r
\r
### JSON解析头文件\r
\r
\`\`\`c++\r
// ========== JSON解析头文件（解析百度返回数据）==========\r
// JSON文档顶层容器，整个返回JSON包一层\r
#include <QJsonDocument>\r
// JSON对象 {key:value} 格式，取access_token、error_code、车牌信息\r
#include <QJsonObject>\r
// JSON数组 [] 格式，识别多张车牌时的列表\r
#include <QJsonArray>\r
\`\`\`\r
\r
## 变量声明和初始化\r
\r
### m_netMgr\r
\r
含义：**全局网络请求管理器**，专门用来发 HTTP GET/POST 请求（调用百度 AI 接口)\r
\r
\`QNetworkAccessManager* m_netMgr\`\r
\r
在构造函数里面的初始化列表进行初始化    m_netMgr(new QNetworkAccessManager(this))  \r
\r
---\r
\r
在堆创建网络管理对象\r
\r
参数 \`this\` 把当前 MainWindow 设为它的父对象，窗口关闭自动释放网络对象，不用手动删\r
\r
\r
\r
### connect信号槽绑定\r
\r
\`\`\`c++\r
connect(m_netMgr, &QNetworkAccessManager::finished,\r
        this, &MainWindow::onNetReplyFinished);\r
\`\`\`\r
\r
- 信号发送者 	                                    网络管理器，只要它发出网络请求（get/post），请求结束（成功 / 失败 / 断网）就会触发 \`finished\` 信号.\r
- 信号：\`&QNetworkAccessManager::finished\`           每次网络请求完成，会携带本次请求的返回数据对象 \`QNetworkReply*\` 发出去。\r
- 接收者：\`this\`			                         接收信号的对象 = 当前 MainWindow 窗口。\r
- 槽函数：\`&MainWindow::onNetReplyFinished\`           回调函数，所有百度接口返回数据全部在这里统一处理.\r
- \r
\r
### m_filePath\r
\r
类型：\`QString m_filePath\`			作用：保存用户选择的本地图片完整路径\r
\r
\r
\r
### m_accessToken\r
\r
QString m_accessToken			    核心作用：百度 AI 鉴权令牌\r
\r
调用车牌识别接口必须带上这个 token，相当于访问百度接口的 “通行证”，有效期 30 天。\r
\r
\r
\r
## 加载图片\r
\r
open图片的按键槽函数\r
\r
### 弹出文件选择框\r
\r
获取图片的地址 类型QString\r
\r
\`\`\`c++\r
QString selectPath = QFileDialog::getOpenFileName(\r
    this,                                  						 // 父窗口，弹窗依附当前窗口\r
    tr("请选择车牌图片"),                  				       // 弹窗标题\r
    QDir::homePath(),                      						// 默认打开路径：系统用户主目录（桌面/用户文件夹）\r
    tr("图片文件 (*.jpg *.jpeg *.png *.bmp)") 					 // 文件过滤器，只显示这几种图片\r
);\r
\`\`\`\r
\r
### QImage 加载图片\r
\r
\`\`\`c++\r
QImage img(m_filePath);\r
if(img.isNull())\r
{\r
    QMessageBox::warning(this, "图片错误", "图片损坏或格式不支持！");\r
    m_filePath = "";\r
    return;\r
}\r
\`\`\`\r
\r
### 显示图片到label\r
\r
\`\`\`c++\r
ui->label_img->setPixmap(QPixmap::fromImage(img).scaled(\r
    ui->label_img->size(), Qt::KeepAspectRatio, Qt::SmoothTransformation\r
));\r
\`\`\`\r
\r
## 识别图片\r
\r
identify按键槽函数\r
\r
首先进行判断是否拿到了第一张图片  在判断有无拿到百度token\r
\r
\`\`\`c++\r
if(m_accessToken.isEmpty())\r
{\r
    ui->plainText_result->appendPlainText("\\n正在向百度服务器获取鉴权令牌...");\r
    getAccessToken();\r
}\r
else\r
{\r
    // 有token直接识别\r
    QString base64Str = imgToBase64(m_filePath);\r
    if(base64Str.isEmpty())\r
    {\r
        ui->plainText_result->appendPlainText("图片编码失败，终止识别");\r
        return;\r
    }\r
    sendOCRRequest(base64Str);\r
}\r
\`\`\`\r
\r
### getAccessToken()\r
\r
自己封装的网络请求函数\r
\r
\r
\r
### imgToBase64 处理图片\r
\r
\`\`\`c++\r
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
\`\`\`\r
\r
\r
\r
### imgToBase64(m_filePath)\r
\r
工具函数，传入图片路径读取本地图片二进制，转成 Base64 编码字符串；百度 OCR 接口不支持传本地文件，只能上传 Base64 文本,返回值存入 \`base64Str\` 字符串。\r
\r
#### 返回空的情况\r
\r
- 图片损坏\r
- 读取权限不足\r
- 文件为空时\r
\r
因此加以判断是否为空字符串\r
\r
\`\`\`c++\r
if(base64Str.isEmpty())\r
{\r
    ui->plainText_result->appendPlainText("图片编码失败，终止识别");\r
    return;\r
}\r
\`\`\`\r
\r
\r
\r
### sendOCRRequest识别接口\r
\r
sendOCRRequest(base64Str);\r
\r
把转好的图片 Base64 字符串传进去，函数内部拼接带 token 的识别地址、组装 POST 表单、发送网络请求上传图片识别。\r
\r
\r
\r
## Token获取\r
\r
### void MainWindow::getAccessToken()\r
\r
向百度服务器发送 **GET 请求**，换取 \`access_token\`（接口访问通行证）\r
\r
#### tokenUrl\r
\r
- \`QUrl\`：Qt 专门用来存储、处理网络地址的类；\r
- 引号内是百度固定 OAuth2 鉴权接口地址，**不能修改**，是百度 AI 统一拿 token 的地址。\r
\r
QUrl tokenUrl("https://aip.baidubce.com/oauth/2.0/token");\r
\r
百度接口不能直接传图片，必须先拿 token，有效期 30 天，拿到后缓存 \`m_accessToken\` 不用重复获取		https://aip.baidubce.com/oauth/2.0/token\r
\r
\r
\r
#### QUrlQuery\r
\r
专门拼接 URL 问号后面的参数（\`?key=value&key2=value2\`），自动处理中文、特殊符号转义，比手动拼接字符串安全。\r
\r
\`\`\`\`c++\r
QUrlQuery params;\r
params.addQueryItem("grant_type", "client_credentials");\r
params.addQueryItem("client_id", API_KEY);\r
params.addQueryItem("client_secret", SECRET_KEY);\r
tokenUrl.setQuery(params);\r
\`\`\`\`\r
\r
三个固定参数:\r
\r
- \`grant_type=client_credentials\`：	              固定死，代表 “密钥鉴权模式”。\r
- \`client_id=API_KEY\`：			                  百度应用 AK 密钥，类里定义好的常量。\r
- \`client_secret=SECRET_KEY\`：                       你的百度应用 SK 密钥；\r
\r
#### tokenUrl.setQuery(params)\r
\r
把拼接好的全部参数挂载到 url 地址上，最终完整 url 类似		edge：https://xxx/token?grant_type=client_credentials&client_id=xxx&client_secret=xxx\r
\r
\r
\r
#### 请求对象\r
\r
\`QNetworkRequest\`：封装一条完整 HTTP 请求，把带参数的 url 传进去，构建请求对象。\r
\r
\`\`\`c++\r
QNetworkRequest request(tokenUrl);\r
\`\`\`\r
\r
#### 发送请求\r
\r
\`\`\`c++\r
m_netMgr->get(request);\r
\`\`\`\r
\r
- \`-m_netMgr\` 全局网络管理器；\r
\r
- \`.get()\`：发送 **GET 网络请求**；\r
-  服务器返回数据后，自动触发之前绑定的 \`onNetReplyFinished\` 回调函数解析 token。\r
\r
\r
\r
## 网络异步回调函数 onNetReplyFinished\r
\r
### reply\r
\r
入参 \`QNetworkReply *reply\`，本次网络请求的应答对象，存服务器返回的全部内容；\r
\r
\`reply->readAll()\`：一次性读取百度返回的全部字节数据（JSON 字符串），存入二进制容器 \`QByteArray rawData\`；\r
\r
网络请求用完必须释放，是延迟销毁应答对象，防止内存泄漏，固定写法。\r
\r
\r
\r
### 底层网络错误处理\r
\r
\`\`\`c++\r
if(reply->error() != QNetworkReply::NoError)\r
{\r
    QString errInfo = QString("网络错误码%1：%2").arg(reply->error()).arg(reply->errorString());\r
    ui->plainText_result->appendPlainText(errInfo);\r
    return;\r
}\r
\`\`\`\r
\r
- \`reply->error()\`：            获取网络底层错误码；\r
\r
- \`QNetworkReply::NoError\`      代表网络通信正常；不等于这个值说明网络层面失败：无网络、防火墙拦截、域名无法访问；\r
\r
- \`arg()\`                      字符串格式化，拼接错误码 + 错误描述，打印到界面日志；\r
\r
- \`return\`                     直接结束函数，不再解析 JSON。\r
\r
### JSON 对象\r
\r
\`\`\`c++\r
QJsonDocument jsonDoc = QJsonDocument::fromJson(rawData);\r
QJsonObject jsonObj = jsonDoc.object();\r
\`\`\`\r
\r
- \`QJsonDocument::fromJson(rawData)\`：     把原始字节流转成 JSON 文档；\r
\r
- \`.object()\`：                           JSON 最外层是大括号 \`{}\` 对象格式，转成 \`QJsonObject\`，方便通过 key 读取字段。\r
\r
### 1 if \r
\r
\`\`\`c++\r
if(jsonObj.contains("access_token"))\r
{\r
    m_accessToken = jsonObj["access_token"].toString();\r
    ui->plainText_result->appendPlainText("令牌获取成功，调用车牌识别接口");\r
    qDebug() << "成功拿到token：" << m_accessToken;\r
\r
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
\`\`\`\r
\r
\r
\r
### 2 if\r
\r
\`\`\`c++\r
if(jsonObj.contains("error_code"))\r
{\r
    QString errCode = jsonObj["error_code"].toString();\r
    QString errMsg = jsonObj["error_msg"].toString();\r
    QString fullErr = QString("百度接口报错[%1]：%2").arg(errCode, errMsg);\r
    ui->plainText_result->appendPlainText(fullErr);\r
    return;\r
}\r
\`\`\`\r
\r
\r
\r
### 3 if\r
\r
\`\`\`c++\r
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
\`\`\`\r
\r
\`\`\`\r
QJsonArray plateArray = jsonObj["words_result"].toArray();\r
\`\`\`\r
\r
\`words_result\` 是 JSON 数组 \`[]\`，一张图可能多张车牌，转成 \`QJsonArray\` 容器；\r
\r
定义字符串 \`printResult\` 用来拼接最终展示文本；\r
\r
范围 for 循环遍历数组中每一张车牌：\r
\r
- \`plateItem\` 数组里单个车牌对象，转 \`QJsonObject plateObj\`；\r
- \`plateObj["number"].toString()\`：取出车牌号码；\r
- \`plateObj["color"].toString()\`：取出车牌颜色 blue/yellow/green；\r
- 拼接格式化文字；\r
\r
\`\`\`\r
ui->plainText_result->setPlainText(printResult);\r
\`\`\`\r
\r
\`setPlainText\` 覆盖文本框原有内容，完整展示所有车牌识别结果\r
\r
\r
\r
## 已有图片请求调用函数\r
\r
携带已转好的图片 Base64 字符串，**发送 POST 请求调用百度车牌识别接口**，上传图片并获取车牌信息。\r
\r
\`\`\`c++\r
QString ocrUrlStr = "https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate?access_token=" + m_accessToken;\r
QUrl ocrUrl(ocrUrlStr);\r
\`\`\`\r
\r
\`QUrl ocrUrl(ocrUrlStr)\`：把拼接好的完整字符串转为 Qt 网络专用地址对象。\r
\r
\r
\r
\`\`\`c++\r
QString safeBase64 = base64Img;\r
safeBase64.replace("+", "%2B");\r
safeBase64.replace("/", "%2F");\r
safeBase64.replace("=", "%3D");\r
\`\`\`\r
\r
Base64 编码自带三种符号：\`+ / =\`\r
\r
HTTP 表单提交时，服务器会把这三个符号当成分隔符解析，直接导致图片参数错乱，百度返回图片格式错误,必须替换成标准 URL 编码。\r
\r
\r
\r
相关配置\r
\r
\`\`\`c++\r
QUrlQuery postBody;\r
postBody.addQueryItem("image", safeBase64);\r
postBody.addQueryItem("multi_detect", "true");\r
postBody.addQueryItem("detect_complete", "false");\r
postBody.addQueryItem("detect_risk", "false");\r
\`\`\`\r
\r
\`QUrlQuery\` 在这里用来构建 POST 表单 \`x-www-form-urlencoded\` 格式数据，每个 \`addQueryItem("参数名","值")\` 对应百度接口文档参数\r
\r
image（必填核心参数） 值是转义后的图片 Base64 字符串，上传图片全靠这个参数；\r
\r
multi_detect\`：\`true    开启多车牌检测，一张图片里识别全部车牌；设为 false 只识别画面最清晰一张；\r
\r
detect_complete\`：\`false   是否只识别完整无遮挡车牌；false 允许识别部分遮挡、截断车牌；\r
\r
detect_risk\`：\`false        风险车辆（黑名单）检测，不需要就关闭，减少接口耗时。\r
\r
\r
\r
把参数转为 POST 提交字节流 + 构造请求\r
\r
\`\`\`c++\r
QByteArray postData = postBody.toString(QUrl::FullyEncoded).toUtf8();\r
QNetworkRequest request(ocrUrl);\r
request.setRawHeader("Content-Type", "application/x-www-form-urlencoded");\r
\`\`\`\r
\r
发送 POST 网络请求\r
\r
\`\`\`\r
m_netMgr->post(request, postData);\r
ui->plainText_result->appendPlainText("开始识别图片车牌...");\r
\`\`\`\r
\r
## 总体流程\r
\r
\`\`\`mermaid\r
flowchart TD\r
    A[程序初始化]\r
    A --> A1[创建网络管理器]\r
    A1 --> A2[绑定网络回调函数]\r
\r
    B[用户选择图片]\r
    B --> B1[保存图片路径]\r
    B1 --> C[点击识别按钮]\r
\r
    C --> D{有无token?}\r
    D -- 无 --> E[请求百度token]\r
    E --> F[拿到token后转图片base64]\r
\r
    D -- 有 --> F\r
    F --> G[发送车牌识别请求]\r
    G --> H[统一回调处理返回数据]\r
\r
    H --> I{网络出错?}\r
    I -- 是 --> I1[打印网络错误]\r
    I -- 否 --> J{接口报错?}\r
    J -- 是 --> J1[打印业务错误码]\r
    J -- 否 --> K[解析并展示车牌]\r
\`\`\`\r
\r
\r
\r
\r
\r
\`\`\`mermaid\r
flowchart TD\r
    M["m_netMgr 网络管理器"]\r
    S["信号：finished(QNetworkReply*)"]\r
    C["槽函数：onNetReplyFinished"]\r
    Bind["connect绑定<br/>M::finished → this::onNetReplyFinished"]\r
    F1["getAccessToken 执行 m_netMgr->get()"] --> M\r
    F2["sendOCRRequest 执行 m_netMgr->post()"] --> M\r
    M --> S\r
    S --> C\r
    C --> 分支判断{"Token返回 / 报错 / 识别结果"}\r
\`\`\`\r
\r
\r
\r
`;export{r as default};
