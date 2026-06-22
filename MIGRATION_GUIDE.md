# 采购进度桌面工作台 —— Electron + SQLite 迁移与打包指南

针对您的最终目标（无网依赖、不依赖 Gemini API、本地 SQLite 双备机制、不惧版本升级的 `%APPDATA%` 数据隔离），本项目已经重构了高鲁棒性的 **Hybrid Desktop 架构**。

此设计完美兼容 **网页在线仿真调试** 与 **本地 Windows 桌面物理持久化**。当通过 Electron 启动该程序时，React 视图可以毫无缝隙地切换至本地 SQLite 数据总线。

---

## 一、 系统架构解析

我们实现了具备 **“安全降级/自动重连”**（Resilient Database Core）的架构设计：

```
       ┌────────────────────────────────────────────────────────┐
       │                 采购流程管理系统 React UI                │
       └───────────────────────────┬────────────────────────────┘
                                   │
                    (检测 window.electronAPI 句柄)
                     /                           \
               [有 Electron 宿主]             [无 Electron 宿主]
                   /                               \
    ┌─────────────────────────────┐        ┌──────────────────────────────┐
    │  IPC: window.electronAPI    │        │  HTML5 LocalStorage 仿真映射   │
    │  (数据读写、本地物理级还原)     │        │  (在线调试与双向预览测试)     │
    └──────────────┬──────────────┘        └──────────────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │     Electron Main Process    │
    └──────────────┬──────────────┘
                   │
         [初始化数据库与双备机制]
         - 主库路径：%APPDATA%/ProcurementWorkbench/database/data.db
         - 备份路径：%APPDATA%/ProcurementWorkbench/backups/backup_xxxx.db
                   │
         ┌─────────┴─────────┐
         ▼                   ▼ (编译环境缺少本地 C++ 驱动时)
  [SQLite 原生层驱动]    [高性能原子 JSON 文件系统驱动]
  (better-sqlite3 /      (Fail-safe Fallback Engine)
   sqlite3 引擎集成)
```

### 1. 数据高可靠：彻底封杀版本升级带来的数据丢失
- **默认用户路径**：在 Electron 主线程中，我们通过 `app.getPath('userData')` 定位 Windows 系统目录：
  - 会话地址一般为：`C:\Users\<您的用户名>\AppData\Roaming\react-example`（打包成“采购流程工作台”后，注册表将自动更名为 `ProcurementWorkbench`）。
- **文件与防灾隔离**：所有物理的 SQLite 库件及还原备份均寄宿于该持久域，即使您升级覆盖安装 `.exe` 软件，**本地数据依然岿然不动**，安全系满。

### 2. 双通道安全回退：零门槛首批编译
- 本地打包 Electron 时，Node.js 往往因宿主缺少 C++ 编译器（Compiler Toolchain）而在安装 `better-sqlite3` 时报错。
- 我们特别在 `/electron/main.js` 中加入了 **双路回退容灾引擎**：如果检测到没有 `better-sqlite3` 驱动，会自动启用自带的 **原子级别高一致性 JSON 定向 SQLite 持久化**，确保系统在 Windows 本地一键无痕秒启动！

---

## 二、 迁移与本地运行三部曲

当您将代码拉取到您的本地 Windows 主机时，请确保本地已预装：
- **Node.js** (推荐 v18 或 v20)
- **Git**

### 步骤 1：本地解压并安装基础依赖
打开 CMD 或 PowerShell 终端，切换到项目根目录下，执行如下命令：
```bash
# 1. 安装基础跨平台依赖 
npm install
```

### 步骤 2：加载本地专用 SQLite 驱动（可选，但推荐）
为了开启极速索引的数据库原生操作，请按需安装原生驱动：
```bash
# 安装 better-sqlite3 核心底层组件
npm install better-sqlite3 --save-dev
```
> *(注：若因 Windows C++ 工作组件缺失报错，可选择不安装。系统会自动启动内置的高性能轻量存储内核，数据和功能完全对等！)*

### 步骤 3：本地 Electron 调试模式启动
```bash
# 启动本地开发代理，同时唤醒 Electron 本地视窗桌面
npm run dev

# (在另一个终端中，或者您本地拉起)
npm run electron:start
```

---

## 三、 生成可执行文件 (Setup.exe & Portable.exe)

我们已经在 `package.json` 中完整集成了 `electron-builder` 以及编译配置文件 `electron-builder.yml`。

以下为一键生成 Windows 两大终端分发文件的快捷指令：

### 1. 编译生成 Setup 安装包 (`Setup.exe`)
- **输出成果物**：双击即可加载标准 Windows 安装向导的安装程序。
- **自定义选项**：支持用户自定义选择安装路径，支持在桌面和开始菜单自动创设高分辨率启动图标，配备标准一键反向卸载向导。
- **构建机制**：
  ```bash
  npm run build:win-setup
  ```

### 2. 编译生成单文件绿色版 (`Portable.exe`)
- **输出成果物**：无需安装，即点即用。双击即开始工作。
- **用户隔离数据**：即使是免安装的绿色单文件版，数据依然保存置于用户本机的 `%APPDATA%` 中，**安全和升级迁移特性与安装版完全一致**！
- **构建机制**：
  ```bash
  npm run build:win-portable
  ```

### 3. 同时打包两种 Windows 成果物
- 一键导出 Setup 安装器与免装绿色独立版：
  ```bash
  npm run build:win-all
  ```
- **输出根目录**：生成的成果物将打包储存至根目录下的 `./dist_electron/` 文件夹内。

---

## 四、 本地自动与手动备份规则

当您在 Windows 桌面运行时，我们将数据保护级直接拉满：
1. **日巡自动备份**：当每日首次冷拉客户端时，系统会在 `%APPDATA%/ProcurementWorkbench/backups/` 下自动抓取今日的状态备份（命名如 `backup_2026-06-22.db`）。
2. **退出自封机制**：每一次您正常退出软件窗口，退出事件会自动重新捕捉差异、触发快速合并校验，确保内存上的变更瞬时安全写入。
3. **备份额满清理**：为了照顾用户的硬盘空间，主进程只保留最新 30 天的每日镜像档案，最旧的过期档将被智能剪裁删除（支持在系统内自定义开启手动清除）。
4. **一键快速灾备覆写**：进入系统的“数据库管理”，点击任何一个备份包的 **【还原】** 键，系统会安全切断活动 SQLite 流，物理复制覆盖主文件，重新初始化视图索引，保护层级极高。
