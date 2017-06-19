teambition-nginx-gateway
========================

## 思路

利用nginx [X-Accel](https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/)的方法，在`资源服务`前加入`权限服务`。

## 配置

### Teambition 应用
到 https://account.teambition.com/my/apps 添加一个应用，注意回调地址必须是主域加上`/callback`。

### nginx >=1.7.8 配置
```
server {
  ...
  location / {
    proxy_pass   http://localhost:3000;
  }

  location @xaccel {
    internal;
    proxy_pass   http://localhost:9000;
  }
}
```

### 应用部署
参考文件中`docker-compose.yml`, 在环境变量中配置以下项目：
- APP_HOST: 主域名
- APP_CLIENT_ID: Teambition申请应用的Client_Key
- APP_CLIENT_SECRET: Teambition申请应用的Client_Secret
- APP_TEAMBITION_ORG_ID: Teambition企业ID， 一般不用修改，默认为 50c32afae8cf1439d35a87e6
- APP_COOKIE_KEY: Cookie键值， 默认为 Teambition-Access-Token

## 服务实现内容[待定]
- [x] 检查请求者的 Teambition 账号
- [x] 该账号是否在 Teambition 企业里面？
- [x] 最后执行 `this.set('X-Accel-Redirect', '@xaccel')` 标记授权

## 其他TODO
- [ ] 添加测试
- [ ] 能够插入其他中间件
- [ ] 能够配置中间件参数

## Demo
[https://elk.teambition.net/](https://elk.teambition.net/)