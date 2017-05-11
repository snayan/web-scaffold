# web-scaffold
基于`node`和`gulp`，web项目前端自动化构建系统，包含创建，编译，压缩，打包等前端构建流程。

## 使用

克隆web-scaffold仓库到本地，执行`npm install` 下载依赖包，之后就可以新建项目了，开发完成相应的项目，可以编译打包。大体流程如下：

* 克隆web-scaffold仓库到本地

  ````bash
  git clone https://github.com/snayan/app-scaffold.git
  ````

* 下载依赖包，实际开发可以自己修改新增包

  ````bash
  cd app-scaffold && npm install
  ````

* 创建新项目，默认生成项目结构和文件

  ````bash
  gulp new -d newProgramName
  ````

* 开发完成之后，可以编译或者打包

  ````bash
  gulp -d newProgramName
  ````

## 命令

命令的创建方式是基于**[yargs](https://github.com/yargs/yargs)**。基本命令格式是

````bash
gulp command -d progranName [-p]
````

各个命令的详细说明

````
Usage: gulp -d [dirname]
Commands：
  clean         clean dirname
  compress      compress dirname
  new           create a new program
Options:
  -d,  --dirname    dirname     [string][required]
  -p,  --production  production environment
Examples：
  gulp -d someDirName -p
````

## 配置

你可以在web-scaffold目录下新建多个项目，每个项目可能引用的文件，或者编译环境，或者项目结构等不同，但所有这些项目都是基于上述这几个简单的命令完成的。为了实现这些，只需修改每个项目目录下默认的项目配置文件**configfile.js**。默认情况下，web-scaffold目录下也会有一个根配置文件**configfile.js**，在编译打包时，会合并根配置文件和项目配置文件。根配置文件和项目配置文件结构完全一样，可以根据项目去修改项目配置文件。配置文件中所有的文件引用路径都是相对当前配置的。

根配置文件默认结构，可根据实际项目修改

````json
{
  //项目编译环境
  "env":"development",
  //项目的模板文件
  "template":"template.html",
  //项目引用的公共JS，最后会编译成一个vendor.js
  "includejs":[
    "./lib/scripts/zepto.min.js",
    "./lib/scripts/zepto.fx.js"
  ],
  //项目引用的公共scss，最后会编译成一个vendor.css
  "includecss":[
    "./lib/scsss/base/common-2.1.scss"
  ],
  //支持es6
  "babel":["es2015"],
  //支持autoprefixer
  "autoprefixer":{
    "browsers":["last 3 versions","> 1%"]
  },
  //支持px2rem
  "pxtorem":{
    "rootValue":46.875,
    "unitPrecision": 5,
    "propList": ["*", "!font-size"],
    "selectorBlackList": [],
    "replace": true,
    "mediaQuery": false,
    "minPixelValue": 0
  }
}
````

项目配置文件默认结构，可以在项目配置文件中修改覆盖根项目配置文件，注意除了**includejs**和**includecss**会进行合并，其他配置项都会进行替换。

````javascript
{
  //项目中html文件配置，可以配置多个
  "index.html": {
    "title": "页面标题",
    "keywords": "页面关键字",
    "description": "页面描述"
  },
  //指定当前项目的环境
  "env": "production",
  //指定当前项目编译的目标目录
  "dest": "build",
  //指定当前项目引用公共JS和CSS的编译目录，如果不指定默认为vendor目录
  "vendor": {
    "js": "build/scripts",
    "css": "build/scsss"
  }
}
````

## 开发

使用`new`命令新增一个项目时，默认会生成**scripts**，**scsss**，**images**这三个文件夹和**configfile.js**，**index.html**文件。其中，scripts和scsss目录下会默认生成**index.js**和**index.scss**。目录结构如下：

├── configfile.js

├── images

├── index.html

├── scripts

│   └── index.js

└── scsss

​    └── index.scss

在开发时，可以随意增加，删除，修改文件，**但千万不要修改这种目录结构形式**，因为gulp编译打包是根据这个结构来的，除非你自己修改gulpfile文件。

在编辑html时，实际你只需要编辑模版文件的body部分和,css,js引用部分html公共的部分，例如`head`，`mata`等都在模版文件中。默认生成的index.html内容如下：

````html
<!-- 
type类型可以为include和inline
include:外部引用形式
inline:内联插入形式
-->
<link src="scsss/index.scss" type="include" />
<div class="main">
    here your content
</div>
<script src="scripts/index.js" type="include" />
````

其中，type可以为**include**和**inline**，他们的区别是一个外部引用形式，一个是内联插入形式。注意，**include**会与配置文件中**includejs**中指定的js文件合并为一个**vendor.js**。

## 编译

*   执行`gulp -d dirName `就可以执行打包工作了，所有文件都会编译到你配置文件文件中指定的**dest**，编译时为了考虑这些静态文件的版本号，会生成一个版本号的文件**manifest.json**，里面记录对应的文件版本号，你可以自己使用。像下面这样：

    ````json
    {
      "build/index.html": "c15c86d739",
      "build/scripts/index.js": "2523d38771",
      "build/scsss/index.css": "d41d8cd98f"
    }
    ````

*    执行`gulp compress -d dirName`会打包成一个zip，里面包含了项目的所有编译后的文件，这个zip包会生成在**package**目录里，命名方式【项目名】.zip

*   执行`gulp clean -d dirName `会删除项目。

## 备注

实际上[yeoman](http://yeoman.io/)就是专门来做项目脚手架的，为啥我自己非要这样玩呢。其实，主要是自己玩啦，其次是不想下载yeoman，不想学它的API，最后就是可以学习gulp，学习node的stream思想。

谢谢，就酱。