# @md/api 服务

该软件包为 Markdown 处理提供后端 API 服务。

## 使用 Docker

请确保你的系统上已安装并正在运行 Docker。

### 1. 构建 Docker 镜像

在 monorepo 的根目录下，运行以下命令来构建 Docker 镜像。此命令会将 API 服务及其必要的依赖项打包到一个名为 `md-api` 的独立镜像中。

```bash
docker build -t md-api . -f packages/api/Dockerfile
```

### 2. 运行 Docker 容器

镜像构建完成后，你可以使用以下命令将其作为容器运行。这将启动服务并将容器的 3000 端口映射到你本地机器的 3000 端口。

```bash
docker run -itd --name md-api -p 3000:3000 md-api
```

然后，API 服务将在 `http://localhost:3000` 上可用。

## 本地开发

出于开发目的，你可以直接运行该服务而无需使用 Docker。在 monorepo 的根目录下，运行：

```bash
pnpm --filter @md/api dev
```

服务将在 `http://localhost:3000` 上启动。
