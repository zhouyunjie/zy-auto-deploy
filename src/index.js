#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const zipper = require("zip-local");
const shell = require("shelljs");
const chalk = require("chalk");
const CONFIG = require(path.resolve(process.cwd(), "./deploy.config.js"));
const inquirer = require("inquirer");
const NodeSSH = require("node-ssh").NodeSSH;
let SSH = new NodeSSH();
const errorLog = (error) => console.log(chalk.red(`---------------> ${error}`));
const defaultLog = (log) => console.log(chalk.blue(`---------------> ${log}`));
const successLog = (log) => console.log(chalk.green(`---------------> ${log}`));
// 文件夹位置
const distDir = path.resolve(process.cwd(), CONFIG.DIST||'./dist');
const distZipPath = path.resolve(process.cwd(), "./dist.zip");

// 打包 npm run build
const compileDist = async () => {
  // 进入本地文件夹
  shell.cd(path.resolve(process.cwd(), "./"));
  shell.exec(CONFIG.SCRIPT||'npm run build');
  successLog("编译完成");
};

// ********* 压缩dist 文件夹 *********
const zipDist = async () => {
  try {
    if (fs.existsSync(distZipPath)) {
      defaultLog("dist.zip已经存在, 即将删除压缩包");
      fs.unlinkSync(distZipPath);
    } else {
      defaultLog("即将开始压缩zip文件");
    }
    await zipper.sync.zip(distDir).compress().save(distZipPath);
    successLog("文件夹压缩成功");
  } catch (error) {
    errorLog(error);
    errorLog("压缩dist文件夹失败");
  }
};

// ********* 执行清空线上文件夹指令 *********
const runCommond = async (commond) => {
  const result = await SSH.exec(commond, [], { cwd: CONFIG.PATH });

  console.log(chalk.yellow(result));
};
const COMMONDS = CONFIG.COMMONDS || [];
// ********* 执行清空线上文件夹指令 *********
const runBeforeCommand = async () => {
  defaultLog("执行前置命令");
  for (let i = 0; i < COMMONDS.length; i++) {
    await runCommond(COMMONDS[i]);
  }
};

// ********* 通过ssh 上传文件到服务器 *********
const uploadZipBySSH = async () => {
  // 上传文件
  let spinner = ora("准备上传文件").start();
  try {
    await SSH.putFile(distZipPath, CONFIG.PATH + "/dist.zip");
    successLog("完成上传");
    spinner.text = "完成上传, 开始解压";
    await runCommond("unzip -o ./dist.zip");
    spinner.stop();
    successLog("部署完成");
    process.exit(0);
  } catch (error) {
    errorLog(error);
    errorLog("上传失败");
  }
  spinner.stop();
};

// ********* 连接ssh *********
const connectSSh = async () => {
  defaultLog(`尝试连接服务： ${CONFIG.SERVER_PATH}`);
  let spinner = ora("正在连接");
  spinner.start();
  try {
    spinner.stop();
    SSH.connect({
      host: CONFIG.SERVER_PATH,
      username: CONFIG.SSH_USER,
      password: CONFIG.SSH_KEY,
      port: CONFIG.PORT || 22,
    }).then(async () => {
      await runBeforeCommand();
      await uploadZipBySSH();
    });
    successLog("SSH 连接成功");
  } catch (error) {
    errorLog(error);
    errorLog("SSH 连接失败");
  }
};

async function runTask(hasBuild) {
  if (hasBuild) {
    await compileDist();
  }
  await zipDist();
  await connectSSh();
}

console.log(CONFIG);

// defaultLog('服务器配置检查')
inquirer
  .prompt([
    {
      type: "confirm",
      name: "hasBuild",
      message: "是否需要打包",
    },
  ])
  .then((answers) => {
    let hasBuild = answers.hasBuild
      ? true //需要打包直接打包
      : fs.existsSync(distZipPath) // 不需要打包 判断是否有dist.zip 没有的话重新打包
        ? false
        : true
    runTask(hasBuild);
  });
