# ⚠️ Token 权限不足

您当前的 Token 缺少 D1 数据库的权限。

## 🔧 解决方案

### 方案一：创建新的 API Token（推荐）

1. **访问 Token 管理页面**
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. **删除旧 Token**（可选）
   - 找到刚才创建的 Token
   - 点击右侧的 "..." → "Delete"

3. **创建新 Token（使用自定义模板）**
   - 点击 **"Create Token"**
   - 选择 **"Create Custom Token"**
   - Token name: `risk-alert-platform`
   - 添加以下权限：

   **Permissions（权限）：**
   
   | Scope | Resource | Permission |
   |-------|----------|------------|
   | Account | Cloudflare Pages | Edit |
   | Account | D1 | Edit |
   | Account | Workers Scripts | Edit |
   | Zone | Workers Routes | Edit |

4. **完成创建**
   - Account Resources: 选择 "All accounts"
   - Zone Resources: 选择 "All zones"
   - 点击 **"Continue to summary"**
   - 点击 **"Create Token"**
   - **复制新 Token**

5. **告诉我新 Token**
   ```
   新 Token: [粘贴您的新 Token]
   ```

---

### 方案二：编辑现有 Token

1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 找到刚创建的 Token
3. 点击 "Edit"
4. 在 Permissions 中添加：
   - Account → D1 → Edit
   - Account → Cloudflare Pages → Edit
5. 保存

然后告诉我："Token 已更新"

---

## 📋 需要的权限清单

✅ **必须的权限：**
- Account → **Cloudflare Pages** → Edit
- Account → **D1** → Edit
- Account → **Workers Scripts** → Edit
- Zone → **Workers Routes** → Edit

---

## 💡 或者使用更简单的方案

如果觉得配置权限麻烦，我还可以：

### 方案三：使用本地数据库模式部署

不创建云端数据库，仅部署应用框架：
1. 部署到 Cloudflare Pages
2. 您稍后在 Cloudflare Dashboard 中手动创建 D1 数据库
3. 在 Pages 设置中绑定数据库

这样只需要 Pages 权限，不需要 D1 API 权限。

**想用这个方案吗？输入："使用本地数据库模式"**

---

**请选择一个方案并告诉我！** 🚀
