'use strict'
// 操作命令行
const exec = require('child_process').exec;
const co = require('co');
const ora = require('ora');
const prompt = require('co-prompt');
const fs = require('fs');

const tip = require('../tip');
const tpls = require('../../templates');

const spinner = ora('正在生成...');

const execResult = (err, projectName) => {
  spinner.stop();

  if (err) {
    console.log(err);
    tip.fail('请重新运行!');
    process.exit();
  }

  tip.suc('初始化完成！');
  tip.info(`cd ${projectName} && npm install`);
  process.exit();
};

const writeFile = (err, projectName) => {
    // 处理错误
    if (err) {
      console.log(err);
      tip.fail('请重新运行!');
      process.exit();
    }
    execResult(err, projectName);
    process.exit();
  };

const download = (err, projectName, projectDesc, projectAuthor) => {
  if (err) {
    console.log(err);
    tip.fail('请重新运行!');
    process.exit();
  }

  // 删除 git 文件
  exec('cd ' + projectName + ' && rm -rf .git', (err, out) => {
    updatePackage(err, projectName, projectDesc, projectAuthor);
  });
  
}

const updatePackage = (err, projectName, projectDesc, projectAuthor) => {
  if (err) {
    console.log(err);
    tip.fail('请重新运行!');
    process.exit();
  }

  // 更新 package 文件
  exec('cd ' + projectName + ' && cat package.json', (err, out) => {
    let packageJson = JSON.parse(out);
    packageJson['name'] = projectName;
    packageJson['description'] = projectDesc;
    packageJson['author'] = projectAuthor;

    // package.json
    fs.writeFile(projectName + '/package.json', JSON.stringify(packageJson), 'utf-8', writeFile(err, projectName));
  });
  
}

const resolve = (result) => {
  const { tplName, url, branch, projectName, projectDesc, projectAuthor} = result;
  // git命令，远程拉取项目并自定义项目名
  const cmdStr = `git clone ${url} ${projectName} && cd ${projectName} && git checkout ${branch}`;

  spinner.start();
  exec(cmdStr, (err) => {
    download(err, projectName, projectDesc, projectAuthor);
  });
};

module.exports = () => {
  if (!exec('git')) {
    tip.fail('找不到 git 命令，请先安装 git！');
    process.exit();
  }

  co(function *() {
    // 处理用户输入
    const tplName = yield prompt('想用哪个模版呢: ');
    const projectName = yield prompt('项目名字: ');
    const projectDesc = yield prompt('项目描述: ');
    const projectAuthor = yield prompt('项目作者: ');

    if (!tpls[tplName]) {
      tip.fail('模板不存在!');
      process.exit();
    }

    return new Promise((resolve, reject) => {
      resolve({
        tplName,
        projectName: projectName || 'vue项目',
        projectDesc: projectDesc || '项目描述',
        projectAuthor: projectAuthor || 'MapleShaw',
        ...tpls[tplName],
      });
    });
  }).then(resolve);
}