# 前端静态文件自动打包部署

### 安装依赖
```
// 局部安装
npm i zy-auto-deploy -D

// 全局安装
npm i zy-auto-deploy -g

```
### 添加配置文件deploy.config.js

`配置文件放在项目根目录即可`

```
module.exports = Object.freeze({
  SERVER_PATH: "", // 服务器ip地址
  SSH_USER: "root", // 服务器用户名
  SSH_KEY: "", // 服务器密码 
  PORT: 22, // 端口 默认为22
  DIST: "./build", // 需要部署的打包过后的文件夹 根据项目不同值不同 一般为 build static 或者dist
  SCRIPT: "npm run build", // 打包命令 可能项目由不同的构建命令 如打包指定环境的代码
  PATH: "/opt/book/admin", // 服务器存放静态文件目录
  COMMONDS: [`ls`, `rm index.html`, `rm -r css/`, `rm -r js/`], // 上传前执行的命令 本例是指 查看服务器对应/opt/book/admin下的文件 然后删除index.html,css,js这写文件和目录,  之后会执行上传本地文件到服务器操作
});
```

### 使用

如果是项目局部安装  package.json配置一下命令就可以
```
"scripts": {
  ...
  "dev": "",
  "build": "",
  "dpl": "zy-dpl",
  ...
},

npm run dpl
```

执行时会提示是否需要打包  
当选择不需要时 会把本地已有的dist.zip上传  没有dist.zip时会重新执行打包命令

-----------

如果是全局安装 在deploy.config.js目录下执行zy-dpl即可


# 注意

本工具上传时使用`zip-local`工具先压缩后上传 然后在服务器端执行`unzip`解压缩  
所以服务器要安装`unzip`指令 可以求助后台开发 或者自行探索

打包后会在本地生成一个dist.zip压缩包 git忽略即可

