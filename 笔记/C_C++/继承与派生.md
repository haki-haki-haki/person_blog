# 继承与派生

## 访问

### public继承

#### 父类在初始化列表中初始化

```c++
#include <iostream>
using namespace std;

class base
{
private:
    int a, b;
public:
    base(int a1, int b1) : a(a1), b(b1) {}
    ~base() {}
};

class derived : public base
{
private:
    int x, y;
public:
    // 基类构造写在初始化列表！
    derived(int a1, int b1, int x1, int y1) : base(a1, b1)
    {
        x = x1;
        y = y1;
    }
    ~derived() {}
};  // 类结束必须加分号

int main()
{
    derived d(1, 2, 3, 4);
    return 0;
}
```

#### 父类不在初始化列表中初始化

```c++
class point{
public :
   void initPoint(float x=0, float y=0)
	{
    this->x=x;	this->y=y;
	}
    
    float getX() const {return x;}
    float getY() const {return y;}
    
    private:
    float x, y;
};

class rectangle : public point{
    private:
    float w,h;
    
    public:
    void initRectangle(float x, float y , float w , float h)
    {
        initPoint(x,y);
        this->w = w;
        this->h = h;
    }
    
    float getH() const {return h;}
    float getW() const {return w;}
};

int main()
{
    rectangle rect;
    rect.initRectangle(2,3,20,10);
    
    return 0;
}
```



#### 继承规则

```c++
#include <iostream>
using namespace std;

// 基类 Base
class Base
{
public:
    int a = 10;       // public
protected:
    int b = 20;       // protected
private:
    int c = 30;       // private
};

// 公有继承 public
class Derived : public Base
{
public:
    void test()
    {
        // 派生类内部：可以访问基类 public 和 protected
        cout << a << endl;   // ✅ 正常访问
        cout << b << endl;   // ✅ 正常访问

        // cout << c << endl; // ❌ 报错！基类private成员，派生类不能直接访问
    }
};

int main()
{
    Derived d;

    d.test();

    // 派生类对象（外部访问）
    cout << d.a << endl;  // ✅ 可以访问继承来的public成员

    // cout << d.b << endl; // ❌ 报错！b现在是protected，类外不能访问
    // cout << d.c << endl; // ❌ 报错！private根本看不到

    return 0;
}
```



<u>C++ 11及以后版本 类内可以直接给成员变量赋值</u>



### private继承

- 基类 `public` → 派生类中变成 **private**

- 基类 `protected` → 派生类中变成 **private**

- 基类 `private` → 派生类始终无法直接访问
-  main 函数（类外部），派生类对象完全访问不到继承来的所有基类成员

```c++
#include <iostream>
using namespace std;

// 基类
class Base
{
public:
    int pub = 10;
protected:
    int pro = 20;
private:
    int pri = 30;
};

// private 私有继承
class Derived : private Base
{
public:
    void func()
    {
        // 派生类内部：可以访问被继承过来的 pub 和 pro
        cout << pub << endl;  // pub 现在是子类的private，内部能访问 ✅
        cout << pro << endl;  // pro 现在是子类的private，内部能访问 ✅

        // cout << pri << endl; // ❌ 基类私有成员，永远不能直接访问
    }
};

int main()
{
    Derived d;
    d.func();

    // 下面全部报错！外部无法访问基类任何成员
    // cout << d.pub << endl;
    // cout << d.pro << endl;

    return 0;
}
```

```c++
#include <iostream>
using namespace std;

class Base
{
public:
    void fun1()
    {
        cout << "基类公有函数" << endl;
    }
protected:
    void fun2()
    {
        cout << "基类保护函数" << endl;
    }
private:
    void fun3(){}
};

// private 私有继承
class Derived : private Base
{
public:
    void test()
    {
        fun1();  // ✅ 可以调用，只是变成子类private了，内部能用
        fun2();  // ✅ 可以调用
        // fun3(); // ❌ 基类private，永远不能访问
    }
};

int main()
{
    Derived d;
    d.test();

    // d.fun1(); // ❌ main函数里不能调用，已经变成私有
    return 0;
}
```

### protected继承

- 基类 `public` 成员 → 派生类中变成 **protected**
- 基类 `protected` 成员 → 派生类中仍然是 **protected**
- 基类 `private` 成员 → 派生类永远不能直接访问
- 在 main 函数（类外部），派生类对象无法访问继承来的基类成员

```c++
#include <iostream>
using namespace std;

// 基类
class Base
{
public:
    int pub = 10;
protected:
    int pro = 20;
private:
    int pri = 30;
};

// protected 保护继承
class Derived : protected Base
{
public:
    void test()
    {
        // ✅ 派生类内部可以访问：pub 和 pro 现在都是本类的protected
        cout << pub << endl;
        cout << pro << endl;

        // cout << pri << endl; // ❌ 基类私有成员，不能访问
    }
};

int main()
{
    Derived d;
    d.test();

    // 下面两行全部编译报错！
    // cout << d.pub << endl;
    // cout << d.pro << endl;

    return 0;
}
```



## 类型兼容规则

==前提 ： 公有继承==

### 派生类对象可以隐式转换成基类对象(对象切片)

```c++
Base b;
Derived d;

b = d;   // ✅ 合法，子类对象自动赋值给父类对象
```

只会把从基类继承来的成员复制过去，派生类自己新增的成员直接被切掉，**对象切片**。

### 派生类对象可以初始化基类引用

```c++
Derived d;
Base &ref = d;   // ✅ 子类对象绑定到父类引用
```

### 派生类指针可以隐式转为基类指针

```c++
Derived d;
Base *p = &d;   // ✅ 子类地址自动转为父类指针
```

指针指向子类对象，但是 `p->` 只能调用基类的成员，子类新增函数调用不了。



## 构造顺序

```c++
#include <iostream>
using namespace std;

// 基类B1
class B1 {
public:
    B1(int i) {
        cout << "constructing B1 " << i << endl;
    }
};

// 基类B2
class B2 {
public:
    B2(int j) {
        cout << "constructing B2 " << j << endl;
    }
};

// 基类B3
class B3 {
public:
    B3() {
        cout << "constructing B3 *" << endl;
    }
};

// 派生类C，继承顺序：B2  B1  B3
class C : public B2, public B1, public B3
{
public:
    // 初始化列表顺序可以任意写，不影响构造执行顺序
    C(int a, int b, int c, int d)
        : B1(a), memberB2(d), memberB1(c), B2(b)
    {

    }
private:
    // 成员声明顺序决定构造顺序
    B1 memberB1;
    B2 memberB2;
    B3 memberB3;
};

int main()
{
    C obj(1, 2, 3, 4);
    return 0;
}
```

初始化列表只是用来**传递参数**，控制不了构造先后；构造顺序只看：继承顺序 + 成员声明顺序。

初始化列表只负责给构造函数传参，**无法改变执行先后顺序**。

先父类、再成员对象、最后子类本体。

析构函数执行顺序与构造严格相反：先子类函数体 → 销毁成员对象 → 销毁基类（从右向左）。



## 派生类成员标识和访问

#### 同名隐藏原则

```c++
#include <iostream>
using namespace std;

class Base
{
public:
    // 基类两个重载的show函数
    void show()
    {
        cout << "基类无参show" << endl;
    }
    void show(int x)
    {
        cout << "基类带参show：" << x << endl;
    }
};

class Derived : public Base
{
public:
    // 仅仅同名，参数列表不同，就会隐藏基类全部show重载版本
    void show(double d)
    {
        cout << "派生类show：" << d << endl;
    }
};

int main()
{
    Derived d;

    d.show(3.14);   // ✅ 调用派生类自身函数

    // d.show();      // ❌ 编译报错！基类无参版本被完全隐藏，找不到
    // d.show(10);    // ❌ 同样报错，基类重载函数全部被屏蔽

    // 必须加类名限定才能访问基类函数
    d.Base::show();
    d.Base::show(10);

    return 0;
}
```

#### 二义性问题

```c++
#include <iostream>
using namespace std;

class B1{
public:
    void f(){ cout << "B1::f" << endl; }
};

class B2{
public:
    void f(){ cout << "B2::f" << endl; }
    void g(){ cout << "B2::g" << endl; }
};

class D: public B1, public B2{
public:
    void g(){ cout << "D::g" << endl; }
};

int main()
{
    D d;
    // d.f();   // 二义性，编译失败
    d.B1::f();  // 必须限定类名
    d.B2::f();

    d.g();   // 调用D::g，同名隐藏，无报错
    return 0;
}
```

解决方法1

用类名限定

解决方法2

在派生类声明一个同名的函数来隐藏



## 虚基类

```c++
#include <iostream>
using namespace std;

class Animal
{
public:
    int age = 10;
};

class Sheep : public Animal
{
};

class Goat : public Animal
{
};

// 菱形继承：同时继承两个子类
class SheepGoat : public Sheep, public Goat
{
};

int main()
{
    SheepGoat sg;
    // sg.age;  // 编译报错！二义性，不知道是Sheep里的还是Goat里的age
    return 0;
}
```

```c++
#include <iostream>
using namespace std;

class Animal
{
public:
    Animal()
    {
        cout << "Animal构造" << endl;
    }
};

// 虚继承
class Sheep : virtual public Animal
{
public:
    Sheep()
    {
        cout << "Sheep构造" << endl;
    }
};

class Goat : virtual public Animal
{
public:
    Goat()
    {
        cout << "Goat构造" << endl;
    }
};

// 最终子类
class SheepGoat : public Sheep, public Goat
{
public:
    // 这里不需要再写Animal初始化，编译器自动保证Animal只构造一次
    SheepGoat()
    {
        cout << "SheepGoat构造" << endl;
    }
};

int main()
{
    SheepGoat sg;
    return 0;
}
```

```c++
class Animal
{
public:
    Animal(int x) { }
};

class Sheep : virtual public Animal
{
public:
    // 这一行会被忽略！
    Sheep():Animal(10) {}
};

class Goat : virtual public Animal
{
public:
    // 这一行也会被忽略！
    Goat():Animal(20) {}
};

class SheepGoat : public Sheep, public Goat
{
public:
    // 必须由最底层子类亲自初始化虚基类
    SheepGoat():Animal(100)
    {

    }
};
```

公共父类被它的两个直接子类虚继承，virtual 加在中间两层。