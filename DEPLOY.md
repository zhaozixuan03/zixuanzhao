# zixuanzhao.com — 部署指南

你不需要懂代码，按照下面的步骤来就可以。

---

## 第一步：买域名（5分钟）

1. 去 [namecheap.com](https://namecheap.com)
2. 搜索 `zixuanzhao.com`
3. 加入购物车，付款（约 $10/年）
4. 买完先不用管，等会儿回来设置

---

## 第二步：注册 Supabase（数据库，3分钟）

1. 去 [supabase.com](https://supabase.com)，点 "Start your project"
2. 用 GitHub 登录（没有的话先注册一个 GitHub 账号）
3. 点 "New project"，填写：
   - Name：`zixuanzhao`
   - Database Password：设一个你记得住的密码（存好）
   - Region：选 `East Asia (Tokyo)` 或 `Singapore`
4. 等项目创建好（约1分钟）

### 创建数据库表

5. 在 Supabase 左边栏点 "SQL Editor"
6. 把 `supabase-schema.sql` 文件里的全部内容复制粘贴进去
7. 点 "Run"

### 获取 API 密钥

8. 左边栏点 "Project Settings" → "API"
9. 复制以下两个值（待会儿用）：
   - `URL`（Project URL）
   - `anon / public` key

---

## 第三步：注册 Vercel（部署，3分钟）

1. 去 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 先把这个项目文件夹上传到 GitHub：
   - 注册 GitHub 账号
   - 新建一个 repository，命名 `zixuanzhao`
   - 把整个项目文件夹上传上去
3. 在 Vercel 点 "Add New Project"，选择你的 `zixuanzhao` repository
4. 在 "Environment Variables" 里填入：
   ```
   NEXT_PUBLIC_SUPABASE_URL = （第二步复制的 URL）
   NEXT_PUBLIC_SUPABASE_ANON_KEY = （第二步复制的 anon key）
   SITE_PASSWORD = （你想设的密码，用来登录写文章的）
   ```
5. 点 "Deploy"，等 1-2 分钟

---

## 第四步：绑定域名（5分钟）

1. 在 Vercel 的项目页面，点 "Settings" → "Domains"
2. 输入 `zixuanzhao.com`，点 Add
3. Vercel 会给你一些 DNS 记录，复制它们
4. 回到 Namecheap，在你的域名页面找到 "Advanced DNS"
5. 把 Vercel 给的记录填进去
6. 等 5-10 分钟，网站就上线了

---

## 开始写

打开 `zixuanzhao.com/write`，输入你设的密码，开始写。

- 手机和电脑都可以
- 写完选择"公开 / 静悄悄 / 私密"，点发布
- 发布后随时可以编辑，可见性随时可以改

---

## 遇到问题

把错误截图给 Claude 看，一起解决。
