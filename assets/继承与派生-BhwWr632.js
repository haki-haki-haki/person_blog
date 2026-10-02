const n=`# 继承与派生\r
\r
## 访问\r
\r
### public继承\r
\r
#### 父类在初始化列表中初始化\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class base\r
{\r
private:\r
    int a, b;\r
public:\r
    base(int a1, int b1) : a(a1), b(b1) {}\r
    ~base() {}\r
};\r
\r
class derived : public base\r
{\r
private:\r
    int x, y;\r
public:\r
    // 基类构造写在初始化列表！\r
    derived(int a1, int b1, int x1, int y1) : base(a1, b1)\r
    {\r
        x = x1;\r
        y = y1;\r
    }\r
    ~derived() {}\r
};  // 类结束必须加分号\r
\r
int main()\r
{\r
    derived d(1, 2, 3, 4);\r
    return 0;\r
}\r
\`\`\`\r
\r
#### 父类不在初始化列表中初始化\r
\r
\`\`\`c++\r
class point{\r
public :\r
   void initPoint(float x=0, float y=0)\r
	{\r
    this->x=x;	this->y=y;\r
	}\r
    \r
    float getX() const {return x;}\r
    float getY() const {return y;}\r
    \r
    private:\r
    float x, y;\r
};\r
\r
class rectangle : public point{\r
    private:\r
    float w,h;\r
    \r
    public:\r
    void initRectangle(float x, float y , float w , float h)\r
    {\r
        initPoint(x,y);\r
        this->w = w;\r
        this->h = h;\r
    }\r
    \r
    float getH() const {return h;}\r
    float getW() const {return w;}\r
};\r
\r
int main()\r
{\r
    rectangle rect;\r
    rect.initRectangle(2,3,20,10);\r
    \r
    return 0;\r
}\r
\`\`\`\r
\r
\r
\r
#### 继承规则\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
// 基类 Base\r
class Base\r
{\r
public:\r
    int a = 10;       // public\r
protected:\r
    int b = 20;       // protected\r
private:\r
    int c = 30;       // private\r
};\r
\r
// 公有继承 public\r
class Derived : public Base\r
{\r
public:\r
    void test()\r
    {\r
        // 派生类内部：可以访问基类 public 和 protected\r
        cout << a << endl;   // ✅ 正常访问\r
        cout << b << endl;   // ✅ 正常访问\r
\r
        // cout << c << endl; // ❌ 报错！基类private成员，派生类不能直接访问\r
    }\r
};\r
\r
int main()\r
{\r
    Derived d;\r
\r
    d.test();\r
\r
    // 派生类对象（外部访问）\r
    cout << d.a << endl;  // ✅ 可以访问继承来的public成员\r
\r
    // cout << d.b << endl; // ❌ 报错！b现在是protected，类外不能访问\r
    // cout << d.c << endl; // ❌ 报错！private根本看不到\r
\r
    return 0;\r
}\r
\`\`\`\r
\r
\r
\r
<u>C++ 11及以后版本 类内可以直接给成员变量赋值</u>\r
\r
\r
\r
### private继承\r
\r
- 基类 \`public\` → 派生类中变成 **private**\r
\r
- 基类 \`protected\` → 派生类中变成 **private**\r
\r
- 基类 \`private\` → 派生类始终无法直接访问\r
-  main 函数（类外部），派生类对象完全访问不到继承来的所有基类成员\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
// 基类\r
class Base\r
{\r
public:\r
    int pub = 10;\r
protected:\r
    int pro = 20;\r
private:\r
    int pri = 30;\r
};\r
\r
// private 私有继承\r
class Derived : private Base\r
{\r
public:\r
    void func()\r
    {\r
        // 派生类内部：可以访问被继承过来的 pub 和 pro\r
        cout << pub << endl;  // pub 现在是子类的private，内部能访问 ✅\r
        cout << pro << endl;  // pro 现在是子类的private，内部能访问 ✅\r
\r
        // cout << pri << endl; // ❌ 基类私有成员，永远不能直接访问\r
    }\r
};\r
\r
int main()\r
{\r
    Derived d;\r
    d.func();\r
\r
    // 下面全部报错！外部无法访问基类任何成员\r
    // cout << d.pub << endl;\r
    // cout << d.pro << endl;\r
\r
    return 0;\r
}\r
\`\`\`\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class Base\r
{\r
public:\r
    void fun1()\r
    {\r
        cout << "基类公有函数" << endl;\r
    }\r
protected:\r
    void fun2()\r
    {\r
        cout << "基类保护函数" << endl;\r
    }\r
private:\r
    void fun3(){}\r
};\r
\r
// private 私有继承\r
class Derived : private Base\r
{\r
public:\r
    void test()\r
    {\r
        fun1();  // ✅ 可以调用，只是变成子类private了，内部能用\r
        fun2();  // ✅ 可以调用\r
        // fun3(); // ❌ 基类private，永远不能访问\r
    }\r
};\r
\r
int main()\r
{\r
    Derived d;\r
    d.test();\r
\r
    // d.fun1(); // ❌ main函数里不能调用，已经变成私有\r
    return 0;\r
}\r
\`\`\`\r
\r
### protected继承\r
\r
- 基类 \`public\` 成员 → 派生类中变成 **protected**\r
- 基类 \`protected\` 成员 → 派生类中仍然是 **protected**\r
- 基类 \`private\` 成员 → 派生类永远不能直接访问\r
- 在 main 函数（类外部），派生类对象无法访问继承来的基类成员\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
// 基类\r
class Base\r
{\r
public:\r
    int pub = 10;\r
protected:\r
    int pro = 20;\r
private:\r
    int pri = 30;\r
};\r
\r
// protected 保护继承\r
class Derived : protected Base\r
{\r
public:\r
    void test()\r
    {\r
        // ✅ 派生类内部可以访问：pub 和 pro 现在都是本类的protected\r
        cout << pub << endl;\r
        cout << pro << endl;\r
\r
        // cout << pri << endl; // ❌ 基类私有成员，不能访问\r
    }\r
};\r
\r
int main()\r
{\r
    Derived d;\r
    d.test();\r
\r
    // 下面两行全部编译报错！\r
    // cout << d.pub << endl;\r
    // cout << d.pro << endl;\r
\r
    return 0;\r
}\r
\`\`\`\r
\r
\r
\r
## 类型兼容规则\r
\r
==前提 ： 公有继承==\r
\r
### 派生类对象可以隐式转换成基类对象(对象切片)\r
\r
\`\`\`c++\r
Base b;\r
Derived d;\r
\r
b = d;   // ✅ 合法，子类对象自动赋值给父类对象\r
\`\`\`\r
\r
只会把从基类继承来的成员复制过去，派生类自己新增的成员直接被切掉，**对象切片**。\r
\r
### 派生类对象可以初始化基类引用\r
\r
\`\`\`c++\r
Derived d;\r
Base &ref = d;   // ✅ 子类对象绑定到父类引用\r
\`\`\`\r
\r
### 派生类指针可以隐式转为基类指针\r
\r
\`\`\`c++\r
Derived d;\r
Base *p = &d;   // ✅ 子类地址自动转为父类指针\r
\`\`\`\r
\r
指针指向子类对象，但是 \`p->\` 只能调用基类的成员，子类新增函数调用不了。\r
\r
\r
\r
## 构造顺序\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
// 基类B1\r
class B1 {\r
public:\r
    B1(int i) {\r
        cout << "constructing B1 " << i << endl;\r
    }\r
};\r
\r
// 基类B2\r
class B2 {\r
public:\r
    B2(int j) {\r
        cout << "constructing B2 " << j << endl;\r
    }\r
};\r
\r
// 基类B3\r
class B3 {\r
public:\r
    B3() {\r
        cout << "constructing B3 *" << endl;\r
    }\r
};\r
\r
// 派生类C，继承顺序：B2  B1  B3\r
class C : public B2, public B1, public B3\r
{\r
public:\r
    // 初始化列表顺序可以任意写，不影响构造执行顺序\r
    C(int a, int b, int c, int d)\r
        : B1(a), memberB2(d), memberB1(c), B2(b)\r
    {\r
\r
    }\r
private:\r
    // 成员声明顺序决定构造顺序\r
    B1 memberB1;\r
    B2 memberB2;\r
    B3 memberB3;\r
};\r
\r
int main()\r
{\r
    C obj(1, 2, 3, 4);\r
    return 0;\r
}\r
\`\`\`\r
\r
初始化列表只是用来**传递参数**，控制不了构造先后；构造顺序只看：继承顺序 + 成员声明顺序。\r
\r
初始化列表只负责给构造函数传参，**无法改变执行先后顺序**。\r
\r
先父类、再成员对象、最后子类本体。\r
\r
析构函数执行顺序与构造严格相反：先子类函数体 → 销毁成员对象 → 销毁基类（从右向左）。\r
\r
\r
\r
## 派生类成员标识和访问\r
\r
#### 同名隐藏原则\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class Base\r
{\r
public:\r
    // 基类两个重载的show函数\r
    void show()\r
    {\r
        cout << "基类无参show" << endl;\r
    }\r
    void show(int x)\r
    {\r
        cout << "基类带参show：" << x << endl;\r
    }\r
};\r
\r
class Derived : public Base\r
{\r
public:\r
    // 仅仅同名，参数列表不同，就会隐藏基类全部show重载版本\r
    void show(double d)\r
    {\r
        cout << "派生类show：" << d << endl;\r
    }\r
};\r
\r
int main()\r
{\r
    Derived d;\r
\r
    d.show(3.14);   // ✅ 调用派生类自身函数\r
\r
    // d.show();      // ❌ 编译报错！基类无参版本被完全隐藏，找不到\r
    // d.show(10);    // ❌ 同样报错，基类重载函数全部被屏蔽\r
\r
    // 必须加类名限定才能访问基类函数\r
    d.Base::show();\r
    d.Base::show(10);\r
\r
    return 0;\r
}\r
\`\`\`\r
\r
#### 二义性问题\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class B1{\r
public:\r
    void f(){ cout << "B1::f" << endl; }\r
};\r
\r
class B2{\r
public:\r
    void f(){ cout << "B2::f" << endl; }\r
    void g(){ cout << "B2::g" << endl; }\r
};\r
\r
class D: public B1, public B2{\r
public:\r
    void g(){ cout << "D::g" << endl; }\r
};\r
\r
int main()\r
{\r
    D d;\r
    // d.f();   // 二义性，编译失败\r
    d.B1::f();  // 必须限定类名\r
    d.B2::f();\r
\r
    d.g();   // 调用D::g，同名隐藏，无报错\r
    return 0;\r
}\r
\`\`\`\r
\r
解决方法1\r
\r
用类名限定\r
\r
解决方法2\r
\r
在派生类声明一个同名的函数来隐藏\r
\r
\r
\r
## 虚基类\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class Animal\r
{\r
public:\r
    int age = 10;\r
};\r
\r
class Sheep : public Animal\r
{\r
};\r
\r
class Goat : public Animal\r
{\r
};\r
\r
// 菱形继承：同时继承两个子类\r
class SheepGoat : public Sheep, public Goat\r
{\r
};\r
\r
int main()\r
{\r
    SheepGoat sg;\r
    // sg.age;  // 编译报错！二义性，不知道是Sheep里的还是Goat里的age\r
    return 0;\r
}\r
\`\`\`\r
\r
\`\`\`c++\r
#include <iostream>\r
using namespace std;\r
\r
class Animal\r
{\r
public:\r
    Animal()\r
    {\r
        cout << "Animal构造" << endl;\r
    }\r
};\r
\r
// 虚继承\r
class Sheep : virtual public Animal\r
{\r
public:\r
    Sheep()\r
    {\r
        cout << "Sheep构造" << endl;\r
    }\r
};\r
\r
class Goat : virtual public Animal\r
{\r
public:\r
    Goat()\r
    {\r
        cout << "Goat构造" << endl;\r
    }\r
};\r
\r
// 最终子类\r
class SheepGoat : public Sheep, public Goat\r
{\r
public:\r
    // 这里不需要再写Animal初始化，编译器自动保证Animal只构造一次\r
    SheepGoat()\r
    {\r
        cout << "SheepGoat构造" << endl;\r
    }\r
};\r
\r
int main()\r
{\r
    SheepGoat sg;\r
    return 0;\r
}\r
\`\`\`\r
\r
\`\`\`c++\r
class Animal\r
{\r
public:\r
    Animal(int x) { }\r
};\r
\r
class Sheep : virtual public Animal\r
{\r
public:\r
    // 这一行会被忽略！\r
    Sheep():Animal(10) {}\r
};\r
\r
class Goat : virtual public Animal\r
{\r
public:\r
    // 这一行也会被忽略！\r
    Goat():Animal(20) {}\r
};\r
\r
class SheepGoat : public Sheep, public Goat\r
{\r
public:\r
    // 必须由最底层子类亲自初始化虚基类\r
    SheepGoat():Animal(100)\r
    {\r
\r
    }\r
};\r
\`\`\`\r
\r
公共父类被它的两个直接子类虚继承，virtual 加在中间两层。`;export{n as default};
