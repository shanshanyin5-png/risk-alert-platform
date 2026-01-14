# AI搜索功能部署TODO

## 当前状态

✅ **已完成**：
- HTML页面设计和开发
- JavaScript交互逻辑
- 搜索和过滤功能
- AI分析功能
- CSV导出功能
- 文件已创建并提交

⏳ **待解决**：
- 静态文件路由配置（Cloudflare Pages兼容性问题）
- 主页入口链接

## 问题说明

由于Cloudflare Workers/Pages的静态文件服务限制，直接使用`serveStatic`serve HTML文件时可能出现错误。

## 解决方案

### 方案A：内联HTML（推荐）

在 `src/index.tsx` 中添加路由：

```typescript
app.get('/ai-search', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <!-- 完整的HTML内容 -->
    </html>
  `)
})
```

**优点**：
- 完全兼容Cloudflare Pages
- 无需额外配置
- 可靠性高

**缺点**：
- 代码文件较大
- 维护略不便

### 方案B：使用Pages Functions

创建 `functions/ai-search.ts`：

```typescript
export async function onRequest() {
  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  })
}
```

### 方案C：主页集成

将AI搜索功能直接集成到主页Vue应用中：

```javascript
// 在主页app.js中添加AI搜索Tab
{
  name: 'AI搜索',
  component: 'AISearchComponent'
}
```

## 立即可用的临时方案

### 访问方式1：直接访问HTML

```
http://localhost:3000/public/ai-search.html
```

### 访问方式2：从dist访问

```
http://localhost:3000/ai-search.html
```

### 访问方式3：添加主页链接

在主页`src/index.tsx`的HTML中添加：

```html
<a href="/ai-search.html" class="btn">AI智能搜索</a>
```

## 下次部署前操作

1. **选择方案**：推荐方案A（内联HTML）

2. **修改代码**：
   ```bash
   # 读取HTML内容
   cat public/ai-search.html
   
   # 复制内容到路由中
   # 编辑 src/index.tsx
   ```

3. **测试**：
   ```bash
   npm run build
   pm2 restart risk-alert-platform
   curl http://localhost:3000/ai-search
   ```

4. **部署到生产**：
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name risk-alert-platform
   ```

## 文件清单

✅ 已创建：
- `public/ai-search.html` - 页面HTML
- `public/static/ai-search.js` - 交互逻辑
- `AI_SEARCH_FEATURE.md` - 功能文档
- `AI_SEARCH_TODO.md` - 本文档

⏳ 待修改：
- `src/index.tsx` - 添加正确的路由

## 测试检查项

- [ ] 本地访问 `/ai-search` 正常
- [ ] 搜索功能正常工作
- [ ] AI分析正常显示
- [ ] CSV导出正常
- [ ] 所有筛选条件有效
- [ ] 分页功能正常
- [ ] 快速关键词按钮有效

---

**注意**：当前代码已提交但路由配置未完成，需要按上述方案之一完成配置才能正常访问。
