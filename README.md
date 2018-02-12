teambition-nginx-gateway
========================

## 思路

利用nginx [X-Accel](https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/)的方法，在`资源服务`前加入`权限服务`。 本项目利用[Teambition](https://www.teambition.com)中项目成员管理系统。

## 配置

### Teambition 应用
到 https://account.teambition.com/my/apps 添加一个应用，注意回调地址必须是主域加上`/callback`。

### nginx >=1.7.8 配置
```
server {
  ...
  location / {
    ## 填写gateway地址
    proxy_pass   http://localhost:3000;
  }

  location @xaccel {
    ## 填写资源服务地址
    internal;
    proxy_pass   http://localhost:9000;
  }
}
```

### 应用部署
参考文件中`docker-compose.yml`, 在环境变量中配置以下项目：
- APP_HOST: 资源服务域名含http(s)用于授权时跳转用 例如：`https://elk.teambition.net`
- APP_PORT: gateway监听端口
- APP_CLIENT_ID: Teambition申请应用的Client_Key
- APP_CLIENT_SECRET: Teambition申请应用的Client_Secret
- APP_TEAMBITION_ORG_ID: Teambition企业ID, 限定用户只能是某企业中的成员, 默认为空
- APP_TEAMBITION_PROJECT_ID: Teambition项目ID, 限定用户只能是某项目中的成员, 默认为空
- APP_COOKIE_KEY: Cookie键值, 默认为 Teambition-Access-Token, 其Value为Teambition Access Token
- TEAMBITION_ACCOUNT_HOST: Teambition账号中心API地址, 默认为 https://account.teambition.com
- TEAMBITION_API_HOST: Teambition账号中心API地址, 默认为 https://api.teambition.com

## TODO
- [ ] 添加测试
- [ ] 能够插入其他中间件
- [ ] 能够配置中间件参数

## Demo
[https://elk.teambition.net/](https://elk.teambition.net/)