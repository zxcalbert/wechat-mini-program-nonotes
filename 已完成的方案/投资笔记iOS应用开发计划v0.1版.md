# 投资笔记iOS应用开发计划v0.1版

## 文档信息

| 项目名称 | 投资笔记iOS应用 |
|---------|----------------|
| 文档版本 | v0.1版 |
| 创建日期 | 2026-02-22 |
| 文档类型 | 开发计划书 |
| 开发模式 | 渐进式开发 |

---

## 一、项目背景与目标分析

### 1.1 项目背景

**现状分析**
- 当前产品形态：微信小程序版本已上线并运行
- 核心功能：笔记记录、AI助手回复、心境感知、邮票机制、热力图展示
- 用户反馈：经过集中测试和密集使用，发现多个改进方向
- 技术局限：微信小程序平台限制，无法充分发挥iOS平台特性

**迁移至iOS平台的必要性**
1. **平台独立性**：摆脱微信小程序平台的限制，拥有更多自主权
2. **用户体验提升**：iOS平台提供更流畅的用户体验和更丰富的交互方式
3. **功能扩展空间**：iOS平台支持更多原生功能，如推送通知、本地存储、后台任务等
4. **商业化潜力**：iOS用户付费意愿普遍较高，商业化潜力更大
5. **品牌独立性**：建立独立品牌，提升产品辨识度

### 1.2 市场定位

**产品定位**
- **核心定位**：投资写作与自我认知工具
- **差异化定位**：AI驱动的深度思考工具，区别于通用笔记应用
- **情感化定位**：心境感知与情感陪伴，关注用户心理健康
- **长期主义定位**：延迟回复机制，鼓励深度思考和智慧沉淀

**目标用户群体特征**
- **年龄分布**：25-45岁，投资理财意识觉醒阶段
- **职业特征**：白领、自由职业者、创业者、投资者
- **收入水平**：中高收入群体，有付费意愿和能力
- **行为特征**：
  - 有投资理财需求，但缺乏系统化思考
  - 有记录和反思习惯，但缺乏有效工具
  - 注重个人成长和自我提升
  - 对AI技术有接受度和好奇心
- **痛点分析**：
  - 投资决策缺乏深度思考
  - 情绪波动影响投资决策
  - 缺乏有效的自我认知工具
  - 缺乏系统化的投资记录和反思机制

**竞争优势**
1. **AI驱动**：独特的AI助手回复功能，模拟投资大师思维
2. **心境感知**：情感化设计，关注用户心理健康
3. **延迟回复**：独特的延迟机制，鼓励深度思考
4. **极简设计**：符合flomo等优秀产品的极简设计理念
5. **差异化明显**：与通用笔记应用有明显差异

### 1.3 核心商业价值

**用户价值**
- 帮助投资者通过写作了解自己
- 帮助投资者通过写作成长
- 帮助投资者通过写作避免误判
- 帮助投资者通过写作形成智慧
- 帮助投资者通过写作实现长期成功

**商业价值**
1. **直接收入**：邮票购买、会员订阅、高级功能付费
2. **用户粘性**：延迟回复机制、心境感知、热力图等功能提升用户粘性
3. **数据价值**：用户行为数据、心境数据、AI回复数据可用于产品优化
4. **品牌价值**：建立专业、可信的品牌形象

**长期价值**
- 用户生命周期价值（LTV）：预计¥200-500/用户/年
- 付费转化率：参考flomo，预计2-5%
- 月活跃用户（MAU）：预计10,000-50,000（上线6-12个月）
- 年收入潜力：预计¥100万-500万（上线12-18个月）

### 1.4 项目成功关键指标（KPIs）

**用户指标**
- **下载量**：上线3个月内达到10,000次下载
- **日活跃用户（DAU）**：上线6个月内达到1,000 DAU
- **月活跃用户（MAU）**：上线6个月内达到5,000 MAU
- **用户留存率**：
  - 次日留存率：≥30%
  - 7日留存率：≥15%
  - 30日留存率：≥8%
- **用户使用时长**：平均每日使用时长≥5分钟

**功能指标**
- **笔记记录量**：平均每日每用户记录≥0.5条笔记
- **AI回复使用率**：≥40%的用户使用过AI回复功能
- **心境记录率**：≥80%的笔记包含心境信息
- **热力图使用率**：≥30%的用户查看过热力图

**商业指标**
- **付费转化率**：≥2%
- **平均付费金额**：≥¥50/用户
- **用户生命周期价值（LTV）**：≥¥200/用户
- **获客成本（CAC）**：≤¥50/用户
- **LTV/CAC比率**：≥4

**质量指标**
- **应用崩溃率**：≤0.1%
- **应用启动时间**：≤2秒
- **API响应时间**：≤1秒
- **用户满意度评分**：App Store评分≥4.5星

---

## 二、功能需求转化与适配

### 2.1 微信小程序现有功能梳理

**核心功能模块**

| 功能模块 | 功能描述 | 当前实现状态 | 优先级 |
|---------|---------|------------|--------|
| 用户登录 | 微信授权登录 | 已实现 | 高 |
| 笔记记录 | 创建、编辑、删除笔记 | 已实现 | 高 |
| AI助手选择 | 选择6位AI助手之一 | 已实现 | 高 |
| 心境选择 | 选择4种心境之一 | 已实现 | 高 |
| AI回复生成 | 调用DeepSeek API生成回复 | 已实现 | 高 |
| 延迟回复 | 18小时后可见回复 | 已实现 | 高 |
| 邮票机制 | 购买、使用邮票 | 已实现 | 高 |
| 笔记列表 | 展示所有笔记 | 已实现 | 高 |
| 搜索功能 | 搜索笔记内容 | 已实现 | 中 |
| 热力图展示 | 可视化笔记分布 | 已实现 | 中 |
| 回收站 | 删除笔记管理 | 已实现 | 低 |

**数据模型**

```javascript
// 用户数据模型
User {
  id: String
  openid: String
  nickName: String
  avatarUrl: String
  stamps: Number
  totalPurchased: Number
  totalLetters: Number
  lastLoginTime: Date
  createdAt: Date
  updateTime: Date
}

// 笔记数据模型
Letter {
  id: String
  userId: String
  mentor: String  // 查理·芒格/巴菲特/段永平/张小龙/乔布斯/马斯克
  mood: String   // 焦虑/贪婪/平和/困惑
  content: String
  status: String // pending/replied/read/archived
  needReply: Boolean
  replyContent: String
  replyTime: Date
  replyExpectTime: Number
  createTime: Date
  updateTime: Date
  deleteTime: Date
  deleted: Boolean
}

// 邮票历史数据模型
StampHistory {
  id: String
  userId: String
  action: String // 购买/使用
  change: Number
  price: Number
  time: Date
}
```

### 2.2 iOS平台特性适配分析

**功能取舍建议**

| 功能模块 | 微信小程序实现 | iOS适配建议 | 取舍原因 |
|---------|------------|------------|---------|
| 微信登录 | 微信授权登录 | Apple ID登录 + 邮箱登录 | iOS平台特性，符合Apple规范 |
| 微信支付 | 微信支付 | Apple Pay + 内购（IAP） | iOS平台特性，符合Apple规范 |
| 分享功能 | 分享到微信 | 分享到系统分享面板 | iOS平台特性 |
| 推送通知 | 微信模板消息 | APNs推送通知 | iOS平台特性 |
| 本地存储 | 微信云存储 | Core Data本地存储 | iOS平台特性 |
| 云函数调用 | wx.cloud.callFunction | RESTful API调用 | iOS平台特性 |

**iOS特有功能增强方案**

1. **3D Touch/Haptic Feedback**
   - 功能描述：使用3D Touch和触觉反馈增强交互体验
   - 应用场景：
     - 长按笔记卡片显示快捷操作（编辑、删除、收藏）
     - 点击AI回复按钮时提供触觉反馈
     - 购买邮票成功时提供触觉反馈
   - 实施难度：低
   - 优先级：中

2. **Spotlight搜索**
   - 功能描述：集成Spotlight搜索，支持系统级搜索笔记
   - 应用场景：用户可以在系统搜索中直接搜索笔记内容
   - 实施难度：中
   - 优先级：中

3. **Widget小组件**
   - 功能描述：开发主屏幕小组件，快速访问笔记和热力图
   - 应用场景：
     - 快速记录笔记
     - 查看热力图
     - 查看邮票余额
   - 实施难度：高
   - 优先级：低

4. **Siri快捷指令**
   - 功能描述：集成Siri快捷指令，语音快速记录笔记
   - 应用场景：用户可以通过语音快速记录笔记
   - 实施难度：中
   - 优先级：低

5. **Apple Watch应用**
   - 功能描述：开发Apple Watch应用，快速查看笔记和热力图
   - 应用场景：用户可以在手表上快速查看笔记和热力图
   - 实施难度：高
   - 优先级：低

6. **iCloud同步**
   - 功能描述：支持iCloud同步，多设备数据同步
   - 应用场景：用户可以在多个iOS设备间同步数据
   - 实施难度：高
   - 优先级：中

7. **Dark Mode**
   - 功能描述：支持深色模式，提升夜间使用体验
   - 应用场景：用户可以在夜间使用深色模式
   - 实施难度：中
   - 优先级：高

### 2.3 用户体验优化策略

**设计原则**

1. **遵循Apple Human Interface Guidelines**
   - 使用系统字体和图标
   - 遵循iOS设计规范
   - 支持Dynamic Type
   - 支持Voice Over

2. **极简设计**
   - 界面简洁，功能聚焦
   - 操作简单，学习成本低
   - 无干扰设计，专注记录

3. **流畅交互**
   - 启动速度<2秒
   - 页面切换流畅（60fps）
   - 动画自然流畅

4. **情感化设计**
   - 基于心境的界面设计
   - 基于心境的配色方案
   - 基于心境的交互反馈

**交互优化**

1. **手势操作**
   - 左滑删除笔记
   - 右滑恢复笔记
   - 长按显示快捷操作
   - 双击点赞/收藏

2. **动画效果**
   - 页面切换动画
   - 加载动画
   - 成功/失败提示动画
   - AI回复显示动画

3. **触觉反馈**
   - 点击按钮时提供触觉反馈
   - 操作成功时提供触觉反馈
   - 操作失败时提供触觉反馈

### 2.4 功能需求规格说明书（SRS）

**FR-1 用户登录**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-1.1 | 支持Apple ID登录 | 高 | 用户可以使用Apple ID登录，登录成功后获取用户信息 |
| FR-1.2 | 支持邮箱登录 | 高 | 用户可以使用邮箱登录，登录成功后获取用户信息 |
| FR-1.3 | 自动登录 | 高 | 用户登录后，下次打开应用自动登录 |
| FR-1.4 | 退出登录 | 中 | 用户可以退出登录，清除本地数据 |

**FR-2 笔记记录**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-2.1 | 创建笔记 | 高 | 用户可以创建笔记，最少100字 |
| FR-2.2 | 编辑笔记 | 高 | 用户可以编辑已创建的笔记 |
| FR-2.3 | 删除笔记 | 高 | 用户可以删除笔记到回收站 |
| FR-2.4 | 恢复笔记 | 中 | 用户可以从回收站恢复笔记 |
| FR-2.5 | 永久删除 | 低 | 用户可以永久删除笔记 |

**FR-3 AI助手选择**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-3.1 | 选择AI助手 | 高 | 用户可以选择6位AI助手之一 |
| FR-3.2 | 显示AI助手原则 | 高 | 选择AI助手时，显示其核心原则（3-4条） |
| FR-3.3 | AI助手提示 | 中 | 用户不知道可以滑动选择时，显示提示 |

**FR-4 心境选择**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-4.1 | 选择心境 | 高 | 用户可以选择4种心境之一 |
| FR-4.2 | 显示心境说明 | 高 | 选择心境时，显示心境说明 |
| FR-4.3 | 心境影响AI回复 | 高 | 不同心境下的AI回复有明显差异 |

**FR-5 AI回复生成**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-5.1 | 生成AI回复 | 高 | 用户可以选择需要AI回复，消耗1张邮票 |
| FR-5.2 | 延迟回复 | 高 | AI回复18小时后可见 |
| FR-5.3 | 回复内容可复制 | 高 | 用户可以复制AI回复内容 |
| FR-5.4 | 回复署名显示 | 高 | AI回复底部显示AI助手署名 |
| FR-5.5 | 回复个性化 | 高 | AI回复体现AI助手的人设和原则 |
| FR-5.6 | 回复基于心境 | 高 | AI回复基于心境调整语气和重点 |
| FR-5.7 | 回复简短 | 高 | AI回复长度控制在200-300字 |

**FR-6 邮票机制**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-6.1 | 购买邮票 | 高 | 用户可以购买邮票（5/10/20/50张） |
| FR-6.2 | 使用邮票 | 高 | 用户使用AI回复时消耗1张邮票 |
| FR-6.3 | 邮票余额显示 | 高 | 用户可以查看邮票余额 |
| FR-6.4 | 购买历史 | 中 | 用户可以查看邮票购买历史 |
| FR-6.5 | 每日限制 | 高 | 用户每天最多寄送2次需要回复的笔记 |

**FR-7 笔记列表**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-7.1 | 展示笔记列表 | 高 | 用户可以查看所有未删除的笔记 |
| FR-7.2 | 搜索笔记 | 中 | 用户可以搜索笔记内容 |
| FR-7.3 | 下拉刷新 | 中 | 用户可以下拉刷新笔记列表 |
| FR-7.4 | 上拉加载 | 中 | 用户可以上拉加载更多笔记 |

**FR-8 热力图展示**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-8.1 | 展示热力图 | 中 | 用户可以查看过去一年的笔记创作分布 |
| FR-8.2 | 热力图交互 | 低 | 用户可以点击热力图查看某天的笔记 |

**FR-9 Dark Mode**

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|---------|---------|--------|---------|
| FR-9.1 | 支持深色模式 | 高 | 应用支持深色模式，跟随系统设置 |
| FR-9.2 | 主题切换 | 中 | 用户可以手动切换亮色/深色模式 |

---

## 三、技术架构设计

### 3.1 整体架构设计

**架构模式**

采用MVVM（Model-View-ViewModel）架构模式，结合Combine框架进行响应式编程。

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Views   │  │ ViewModels│  │ Coordinators│ │  Router  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ UseCases │  │ Repositories│ │ Services │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Local   │  │  Remote  │  │  Cache   │           │
│  │  Storage │  │  API     │  │  Manager │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**模块划分**

1. **Presentation Layer（表现层）**
   - Views：SwiftUI视图组件
   - ViewModels：视图模型，处理视图逻辑
   - Coordinators：协调器，管理视图导航
   - Router：路由器，处理页面跳转

2. **Business Logic Layer（业务逻辑层）**
   - UseCases：用例，封装业务逻辑
   - Repositories：仓储，数据访问抽象
   - Services：服务，提供通用功能

3. **Data Layer（数据层）**
   - Local Storage：本地存储（Core Data）
   - Remote API：远程API（RESTful API）
   - Cache Manager：缓存管理

### 3.2 数据流转机制

**数据流**

```
User Action → View → ViewModel → UseCase → Repository → API/Local Storage
                ↓
            Combine Publisher
                ↓
            View Update
```

**状态管理**

使用Combine框架进行响应式状态管理：

```swift
class HomeViewModel: ObservableObject {
    @Published var letters: [Letter] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private let fetchLettersUseCase: FetchLettersUseCase
    private var cancellables = Set<AnyCancellable>()
    
    init(fetchLettersUseCase: FetchLettersUseCase) {
        self.fetchLettersUseCase = fetchLettersUseCase
    }
    
    func fetchLetters() {
        isLoading = true
        fetchLettersUseCase.execute()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    self.isLoading = false
                    if case .failure(let error) = completion {
                        self.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { letters in
                    self.letters = letters
                }
            )
            .store(in: &cancellables)
    }
}
```

### 3.3 本地存储方案

**Core Data架构**

使用Core Data进行本地数据存储，支持离线访问和数据同步。

```swift
// Core Data Stack
class CoreDataStack {
    static let shared = CoreDataStack()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "InvestDiary")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data store failed to load: \(error)")
            }
        }
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    func saveContext() {
        let context = viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Core Data save error: \(error)")
            }
        }
    }
}
```

**数据模型**

```swift
// Letter Entity
@objc(Letter)
public class Letter: NSManagedObject, Identifiable {
    @NSManaged public var id: String
    @NSManaged public var userId: String
    @NSManaged public var mentor: String
    @NSManaged public var mood: String
    @NSManaged public var content: String
    @NSManaged public var status: String
    @NSManaged public var needReply: Bool
    @NSManaged public var replyContent: String?
    @NSManaged public var replyTime: Date?
    @NSManaged public var replyExpectTime: Int64
    @NSManaged public var createTime: Date
    @NSManaged public var updateTime: Date
    @NSManaged public var deleteTime: Date?
    @NSManaged public var deleted: Bool
}

// User Entity
@objc(User)
public class User: NSManagedObject, Identifiable {
    @NSManaged public var id: String
    @NSManaged public var openid: String
    @NSManaged public var nickName: String
    @NSManaged public var avatarUrl: String
    @NSManaged public var stamps: Int64
    @NSManaged public var totalPurchased: Int64
    @NSManaged public var totalLetters: Int64
    @NSManaged public var lastLoginTime: Date
    @NSManaged public var createTime: Date
    @NSManaged public var updateTime: Date
}

// StampHistory Entity
@objc(StampHistory)
public class StampHistory: NSManagedObject, Identifiable {
    @NSManaged public var id: String
    @NSManaged public var userId: String
    @NSManaged public var action: String
    @NSManaged public var change: Int64
    @NSManaged public var price: Double
    @NSManaged public var time: Date
}
```

### 3.4 网络请求策略

**API封装**

使用Alamofire进行网络请求，封装API层：

```swift
protocol APIServiceProtocol {
    func login(with request: LoginRequest) -> AnyPublisher<LoginResponse, APIError>
    func fetchLetters() -> AnyPublisher<[Letter], APIError>
    func createLetter(_ letter: Letter) -> AnyPublisher<Letter, APIError>
    func updateLetter(_ letter: Letter) -> AnyPublisher<Letter, APIError>
    func deleteLetter(_ letterId: String) -> AnyPublisher<Void, APIError>
    func generateReply(_ request: ReplyRequest) -> AnyPublisher<ReplyResponse, APIError>
    func purchaseStamps(_ request: PurchaseRequest) -> AnyPublisher<PurchaseResponse, APIError>
}

class APIService: APIServiceProtocol {
    private let baseURL: String
    private let session: URLSession
    
    init(baseURL: String = "https://api.investdiary.com") {
        self.baseURL = baseURL
        self.session = URLSession(configuration: .default)
    }
    
    func login(with request: LoginRequest) -> AnyPublisher<LoginResponse, APIError> {
        let endpoint = "/api/v1/auth/login"
        return performRequest(endpoint: endpoint, method: .post, body: request)
    }
    
    func fetchLetters() -> AnyPublisher<[Letter], APIError> {
        let endpoint = "/api/v1/letters"
        return performRequest(endpoint: endpoint, method: .get)
    }
    
    func createLetter(_ letter: Letter) -> AnyPublisher<Letter, APIError> {
        let endpoint = "/api/v1/letters"
        return performRequest(endpoint: endpoint, method: .post, body: letter)
    }
    
    func updateLetter(_ letter: Letter) -> AnyPublisher<Letter, APIError> {
        let endpoint = "/api/v1/letters/\(letter.id)"
        return performRequest(endpoint: endpoint, method: .put, body: letter)
    }
    
    func deleteLetter(_ letterId: String) -> AnyPublisher<Void, APIError> {
        let endpoint = "/api/v1/letters/\(letterId)"
        return performRequest(endpoint: endpoint, method: .delete)
    }
    
    func generateReply(_ request: ReplyRequest) -> AnyPublisher<ReplyResponse, APIError> {
        let endpoint = "/api/v1/letters/reply"
        return performRequest(endpoint: endpoint, method: .post, body: request)
    }
    
    func purchaseStamps(_ request: PurchaseRequest) -> AnyPublisher<PurchaseResponse, APIError> {
        let endpoint = "/api/v1/stamps/purchase"
        return performRequest(endpoint: endpoint, method: .post, body: request)
    }
    
    private func performRequest<T: Decodable, U: Encodable>(
        endpoint: String,
        method: HTTPMethod,
        body: U? = nil
    ) -> AnyPublisher<T, APIError> {
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                }
                return APIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case encodingError
    case decodingError
    case networkError(Error)
    case serverError(String)
    case unauthorized
    case notFound
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .encodingError:
            return "Encoding error"
        case .decodingError:
            return "Decoding error"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .unauthorized:
            return "Unauthorized"
        case .notFound:
            return "Not found"
        }
    }
}
```

**缓存策略**

使用URLCache进行网络请求缓存：

```swift
class CacheManager {
    static let shared = CacheManager()
    
    private let cache: URLCache
    
    init() {
        let memoryCapacity = 20 * 1024 * 1024  // 20 MB
        let diskCapacity = 100 * 1024 * 1024   // 100 MB
        self.cache = URLCache(memoryCapacity: memoryCapacity, diskCapacity: diskCapacity, diskPath: "URLCache")
        URLCache.shared = self.cache
    }
    
    func clearCache() {
        cache.removeAllCachedResponses()
    }
}
```

### 3.5 与微信小程序技术栈差异对比

| 技术维度 | 微信小程序 | iOS应用 | 差异分析 |
|---------|----------|---------|---------|
| 开发语言 | JavaScript/TypeScript | Swift | 语言差异，需要学习Swift |
| UI框架 | WXML/WXSS | SwiftUI/UIKit | UI框架差异，需要学习SwiftUI |
| 数据存储 | 微信云数据库 | Core Data + RESTful API | 存储方案差异 |
| 网络请求 | wx.request | URLSession/Alamofire | 网络请求方式差异 |
| 状态管理 | Page.data | Combine/Redux | 状态管理方式差异 |
| 用户认证 | 微信授权 | Apple ID/邮箱 | 认证方式差异 |
| 支付方式 | 微信支付 | Apple Pay/IAP | 支付方式差异 |
| 推送通知 | 微信模板消息 | APNs | 推送方式差异 |
| 本地存储 | wx.storage | UserDefaults/Core Data | 本地存储方式差异 |
| 设备能力 | 受限 | 完整 | iOS设备能力更强 |

---

## 四、开发环境搭建

### 4.1 开发环境配置指南

**硬件要求**
- Mac电脑（推荐：MacBook Pro 2019年及以后）
- 至少16GB内存
- 至少512GB存储空间

**软件要求**

| 软件 | 版本要求 | 用途 |
|-----|---------|-----|
| macOS | 12.0 Monterey及以上 | 操作系统 |
| Xcode | 14.0及以上 | iOS开发IDE |
| iOS SDK | 16.0及以上 | iOS开发SDK |
| Swift | 5.7及以上 | 编程语言 |
| Git | 2.30及以上 | 版本控制 |
| CocoaPods | 1.11及以上 | 依赖管理（可选） |
| Swift Package Manager | 内置 | 依赖管理 |

**安装步骤**

1. **安装Xcode**
   ```bash
   # 从App Store安装Xcode
   # 或从Apple Developer网站下载
   ```

2. **安装命令行工具**
   ```bash
   xcode-select --install
   ```

3. **安装Git**
   ```bash
   # macOS通常已预装Git
   git --version
   ```

4. **安装CocoaPods（可选）**
   ```bash
   sudo gem install cocoapods
   pod setup
   ```

5. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/invest-diary-ios.git
   cd invest-diary-ios
   ```

6. **安装依赖**
   ```bash
   # 如果使用Swift Package Manager
   # Xcode会自动安装依赖
   
   # 如果使用CocoaPods
   pod install
   ```

7. **打开项目**
   ```bash
   # 如果使用Swift Package Manager
   open InvestDiary.xcodeproj
   
   # 如果使用CocoaPods
   open InvestDiary.xcworkspace
   ```

### 4.2 第三方库管理方案

**Swift Package Manager（推荐）**

使用Swift Package Manager管理第三方依赖，无需额外配置。

**推荐使用的第三方库**

| 库名 | 用途 | 版本 | 用途描述 |
|-----|-----|-----|---------|
| Alamofire | 网络请求 | 5.7+ | 简化网络请求 |
| Kingfisher | 图片加载 | 7.8+ | 异步图片加载和缓存 |
| SwiftDate | 日期处理 | 6.3+ | 日期时间处理 |
| KeychainAccess | Keychain访问 | 4.2+ | 安全存储敏感信息 |
| SwiftLint | 代码规范 | 0.50+ | 代码规范检查 |
| SnapshotTesting | 快照测试 | 1.13+ | UI快照测试 |

**Package.swift示例**

```swift
// swift-tools-version: 5.7
import PackageDescription

let package = Package(
    name: "InvestDiary",
    platforms: [
        .iOS(.v16)
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.7.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.8.0"),
        .package(url: "https://github.com/malcommac/SwiftDate.git", from: "6.3.0"),
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.0"),
        .package(url: "https://github.com/realm/SwiftLint.git", from: "0.50.0"),
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing.git", from: "1.13.0")
    ],
    targets: [
        .target(
            name: "InvestDiary",
            dependencies: [
                "Alamofire",
                "Kingfisher",
                "SwiftDate",
                "KeychainAccess"
            ]
        ),
        .testTarget(
            name: "InvestDiaryTests",
            dependencies: [
                "InvestDiary",
                "SnapshotTesting"
            ]
        )
    ]
)
```

### 4.3 代码规范

**Swift代码规范**

遵循Swift官方代码规范和SwiftLint规则。

**命名规范**
- 使用驼峰命名法（camelCase）
- 类名、结构体名、枚举名使用大驼峰（PascalCase）
- 变量名、函数名使用小驼峰（camelCase）
- 常量名使用全大写，单词间用下划线分隔（SCREAMING_SNAKE_CASE）

```swift
// 类名
class HomeViewModel: ObservableObject { }

// 变量名
var userName: String = ""

// 常量名
let MAX_RETRY_COUNT = 3
```

**代码格式**
- 使用4空格缩进
- 每行最多120字符
- 函数之间空一行
- 逻辑块之间空两行

**注释规范**
- 使用`///`进行文档注释
- 使用`//`进行单行注释
- 使用`/* */`进行多行注释

```swift
/// 获取用户信息
/// - Parameter userId: 用户ID
/// - Returns: 用户信息
func fetchUser(userId: String) -> User {
    // 实现代码
}

/*
 * 这是一个多行注释
 * 用于解释复杂的逻辑
 */
```

**SwiftLint配置**

创建`.swiftlint.yml`文件：

```yaml
disabled_rules:
  - trailing_whitespace
  - todo

opt_in_rules:
  - empty_count
  - empty_string

excluded:
  - Pods
  - .build

line_length:
  warning: 120
  error: 200
  ignores_function_declarations: true
  ignores_comments: true

type_body_length:
  warning: 300
  error: 500

function_body_length:
  warning: 50
  error: 100

file_length:
  warning: 500
  error: 1000

type_name:
  min_length: 3
  max_length:
    warning: 40
    error: 50

identifier_name:
  min_length:
    warning: 2
    error: 1
  max_length:
    warning: 40
    error: 50
  excluded:
    - id
    - url
    - x
    - y
```

### 4.4 Git工作流

**分支策略**

采用Git Flow工作流：

```
main (生产环境)
  ↑
develop (开发环境)
  ↑
feature/* (功能分支)
hotfix/* (修复分支)
release/* (发布分支)
```

**分支命名规范**

| 分支类型 | 命名规范 | 示例 |
|---------|---------|-----|
| 主分支 | main | main |
| 开发分支 | develop | develop |
| 功能分支 | feature/功能描述 | feature/user-login |
| 修复分支 | hotfix/修复描述 | hotfix/crash-fix |
| 发布分支 | release/版本号 | release/v1.0.0 |

**提交信息规范**

遵循Conventional Commits规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具链

**示例**

```
feat(auth): add Apple ID login

Implement Apple ID login functionality using AuthenticationServices.
- Add SignInWithAppleButton to login view
- Handle authentication callback
- Store user credentials in Keychain

Closes #123
```

**Pull Request规范**

- 标题格式：`[类型] 简短描述`
- 描述内容：
  - 变更说明
  - 测试情况
  - 截图/视频（UI变更）
  - 相关Issue

---

## 五、分阶段开发任务规划

### 5.1 UI/UX设计与实现

**设计规范文档**

**色彩系统**

```swift
enum AppColor {
    // 亮色模式
    static let primary = Color(hex: "#007AFF")
    static let secondary = Color(hex: "#5856D6")
    static let background = Color(hex: "#FFFFFF")
    static let surface = Color(hex: "#F2F2F7")
    static let text = Color(hex: "#000000")
    static let textSecondary = Color(hex: "#8E8E93")
    
    // 深色模式
    static let darkBackground = Color(hex: "#000000")
    static let darkSurface = Color(hex: "#1C1C1E")
    static let darkText = Color(hex: "#FFFFFF")
    static let darkTextSecondary = Color(hex: "#8E8E93")
    
    // 心境色彩
    static let anxiety = Color(hex: "#FF3B30")    // 红色
    static let greed = Color(hex: "#FF9500")       // 橙色
    static let calm = Color(hex: "#34C759")        // 绿色
    static let confusion = Color(hex: "#5856D6")   // 紫色
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

**字体系统**

```swift
enum AppFont {
    static let largeTitle = Font.system(size: 34, weight: .bold)
    static let title1 = Font.system(size: 28, weight: .bold)
    static let title2 = Font.system(size: 22, weight: .bold)
    static let title3 = Font.system(size: 20, weight: .semibold)
    static let headline = Font.system(size: 17, weight: .semibold)
    static let body = Font.system(size: 17, weight: .regular)
    static let callout = Font.system(size: 16, weight: .regular)
    static let subheadline = Font.system(size: 15, weight: .regular)
    static let footnote = Font.system(size: 13, weight: .regular)
    static let caption1 = Font.system(size: 12, weight: .regular)
    static let caption2 = Font.system(size: 11, weight: .regular)
}
```

**间距系统**

```swift
enum AppSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}
```

**圆角系统**

```swift
enum AppCornerRadius {
    static let small: CGFloat = 4
    static let medium: CGFloat = 8
    static let large: CGFloat = 12
    static let xlarge: CGFloat = 16
}
```

**UI组件库开发**

**基础组件**

1. **PrimaryButton**
```swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    var disabled: Bool = false
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(disabled ? Color.gray : AppColor.primary)
                .cornerRadius(AppCornerRadius.medium)
        }
        .disabled(disabled)
    }
}
```

2. **SecondaryButton**
```swift
struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(AppColor.primary)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(AppColor.surface)
                .cornerRadius(AppCornerRadius.medium)
        }
    }
}
```

3. **TextField**
```swift
struct AppTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    var body: some View {
        if isSecure {
            SecureField(placeholder, text: $text)
                .font(.body)
                .padding()
                .background(AppColor.surface)
                .cornerRadius(AppCornerRadius.medium)
        } else {
            TextField(placeholder, text: $text)
                .font(.body)
                .padding()
                .background(AppColor.surface)
                .cornerRadius(AppCornerRadius.medium)
        }
    }
}
```

4. **Card**
```swift
struct Card<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(AppSpacing.md)
            .background(Color.white)
            .cornerRadius(AppCornerRadius.large)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}
```

**界面切图实现**

使用Assets.xcassets管理图片资源：

```
Assets.xcassets/
├── AppIcon.appiconset/
├── LaunchImage.launchimage/
├── Colors.xcassets/
├── logo.imageset/
├── icons/
│   ├── home.imageset/
│   ├── write.imageset/
│   ├── stamps.imageset/
│   └── trash.imageset/
└── illustrations/
    ├── empty.imageset/
    └── error.imageset/
```

### 5.2 核心功能模块开发

**迭代开发模式**

采用渐进式开发模式，每次迭代仅完成一个基本核心特性的开发与单元测试。

**迭代计划**

| 迭代 | 核心特性 | 预计时间 | 交付物 |
|-----|---------|---------|--------|
| 迭代1 | 用户登录 | 3天 | 登录功能、单元测试 |
| 迭代2 | 笔记记录 | 5天 | 创建笔记、单元测试 |
| 迭代3 | AI助手选择 | 2天 | AI助手选择、单元测试 |
| 迭代4 | 心境选择 | 2天 | 心境选择、单元测试 |
| 迭代5 | AI回复生成 | 5天 | AI回复、单元测试 |
| 迭代6 | 邮票机制 | 4天 | 邮票购买、单元测试 |
| 迭代7 | 笔记列表 | 3天 | 笔记列表、单元测试 |
| 迭代8 | 搜索功能 | 2天 | 搜索功能、单元测试 |
| 迭代9 | 热力图展示 | 4天 | 热力图、单元测试 |
| 迭代10 | Dark Mode | 3天 | 深色模式、单元测试 |

**迭代1：用户登录**

**技术实现方案**

```swift
// LoginViewModel
class LoginViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isLoggedIn = false
    
    private let loginUseCase: LoginUseCase
    private var cancellables = Set<AnyCancellable>()
    
    init(loginUseCase: LoginUseCase) {
        self.loginUseCase = loginUseCase
    }
    
    func loginWithAppleID() {
        isLoading = true
        loginUseCase.executeWithAppleID()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    self.isLoading = false
                    if case .failure(let error) = completion {
                        self.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { user in
                    self.isLoggedIn = true
                    self.errorMessage = nil
                }
            )
            .store(in: &cancellables)
    }
    
    func loginWithEmail(email: String, password: String) {
        isLoading = true
        loginUseCase.executeWithEmail(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    self.isLoading = false
                    if case .failure(let error) = completion {
                        self.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { user in
                    self.isLoggedIn = true
                    self.errorMessage = nil
                }
            )
            .store(in: &cancellables)
    }
}

// LoginView
struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    
    var body: some View {
        VStack(spacing: AppSpacing.lg) {
            Spacer()
            
            Image("logo")
                .resizable()
                .frame(width: 120, height: 120)
            
            Text("投资笔记")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("记录心路历程，了解真实的自己")
                .font(.body)
                .foregroundColor(.secondary)
            
            Spacer()
            
            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
            } else {
                VStack(spacing: AppSpacing.md) {
                    SignInWithAppleButton(
                        onRequest: { request in
                            request.requestedScopes = [.fullName, .email]
                        },
                        onCompletion: { result in
                            switch result {
                            case .success(let authorization):
                                viewModel.loginWithAppleID()
                            case .failure(let error):
                                viewModel.errorMessage = error.localizedDescription
                            }
                        }
                    )
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 50)
                    .cornerRadius(AppCornerRadius.medium)
                    
                    Divider()
                        .padding(.vertical, AppSpacing.sm)
                    
                    NavigationLink(destination: EmailLoginView()) {
                        Text("使用邮箱登录")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(AppColor.primary)
                            .cornerRadius(AppCornerRadius.medium)
                    }
                }
            }
            
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.top, AppSpacing.sm)
            }
            
            Spacer()
        }
        .padding(AppSpacing.lg)
        .background(Color(UIColor.systemBackground))
        .fullScreenCover(isPresented: $viewModel.isLoggedIn) {
            HomeView()
        }
    }
}
```

**接口定义**

```swift
// LoginUseCase
protocol LoginUseCaseProtocol {
    func executeWithAppleID() -> AnyPublisher<User, Error>
    func executeWithEmail(email: String, password: String) -> AnyPublisher<User, Error>
}

class LoginUseCase: LoginUseCaseProtocol {
    private let userRepository: UserRepositoryProtocol
    private let authRepository: AuthRepositoryProtocol
    
    init(
        userRepository: UserRepositoryProtocol,
        authRepository: AuthRepositoryProtocol
    ) {
        self.userRepository = userRepository
        self.authRepository = authRepository
    }
    
    func executeWithAppleID() -> AnyPublisher<User, Error> {
        return authRepository.loginWithAppleID()
            .flatMap { credential in
                self.userRepository.saveUser(credential.user)
            }
            .eraseToAnyPublisher()
    }
    
    func executeWithEmail(email: String, password: String) -> AnyPublisher<User, Error> {
        return authRepository.loginWithEmail(email: email, password: password)
            .flatMap { credential in
                self.userRepository.saveUser(credential.user)
            }
            .eraseToAnyPublisher()
    }
}
```

**开发优先级**

1. Apple ID登录（高）
2. 邮箱登录（高）
3. 自动登录（中）
4. 退出登录（低）

**验收标准**
- 用户可以使用Apple ID登录
- 用户可以使用邮箱登录
- 登录成功后自动跳转到首页
- 登录失败时显示错误信息
- 单元测试覆盖率≥80%

### 5.3 数据接口对接

**API设计**

**RESTful API规范**

```
Base URL: https://api.investdiary.com/v1

认证: Bearer Token

请求头:
Content-Type: application/json
Authorization: Bearer {token}

响应格式:
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**API接口列表**

| 接口 | 方法 | 路径 | 描述 |
|-----|------|-----|-----|
| 登录 | POST | /auth/login | 用户登录 |
| 获取笔记列表 | GET | /letters | 获取笔记列表 |
| 创建笔记 | POST | /letters | 创建笔记 |
| 更新笔记 | PUT | /letters/{id} | 更新笔记 |
| 删除笔记 | DELETE | /letters/{id} | 删除笔记 |
| 生成AI回复 | POST | /letters/reply | 生成AI回复 |
| 购买邮票 | POST | /stamps/purchase | 购买邮票 |
| 获取邮票余额 | GET | /stamps/balance | 获取邮票余额 |
| 获取邮票历史 | GET | /stamps/history | 获取邮票历史 |

**API请求封装**

```swift
// APIClient
class APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://api.investdiary.com/v1"
    private let session: URLSession
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
    }
    
    func request<T: Decodable, U: Encodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: U? = nil,
        requiresAuth: Bool = true
    ) -> AnyPublisher<T, APIError> {
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if requiresAuth, let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.encodingError)
                    .eraseToAnyPublisher()
            }
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: APIResponse<T>.self, decoder: JSONDecoder())
            .map { $0.data }
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                }
                return APIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
}

struct APIResponse<T: Decodable>: Decodable {
    let code: Int
    let message: String
    let data: T
}
```

**响应处理机制**

```swift
// Error Handling
enum APIError: Error, LocalizedError {
    case invalidURL
    case encodingError
    case decodingError
    case networkError(Error)
    case serverError(Int, String)
    case unauthorized
    case notFound
    case tooManyRequests
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "无效的URL"
        case .encodingError:
            return "编码错误"
        case .decodingError:
            return "解码错误"
        case .networkError(let error):
            return "网络错误: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "服务器错误(\(code)): \(message)"
        case .unauthorized:
            return "未授权，请重新登录"
        case .notFound:
            return "资源不存在"
        case .tooManyRequests:
            return "请求过于频繁，请稍后再试"
        }
    }
}

// Token Management
class TokenManager {
    static let shared = TokenManager()
    
    private let keychain = Keychain(service: "com.investdiary.tokens")
    private let tokenKey = "auth_token"
    
    func saveToken(_ token: String) {
        try? keychain.set(token, key: tokenKey)
    }
    
    func getToken() -> String? {
        return try? keychain.get(tokenKey)
    }
    
    func clearToken() {
        try? keychain.remove(tokenKey)
    }
}
```

### 5.4 第三方服务集成

**AuthenticationServices（Apple ID登录）**

```swift
import AuthenticationServices

struct SignInWithAppleButton: UIViewRepresentable {
    var onRequest: (ASAuthorizationAppleIDRequest) -> Void = { _ in }
    var onCompletion: (Result<ASAuthorization, Error>) -> Void = { _ in }
    
    func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
        let button = ASAuthorizationAppleIDButton(
            authorizationButtonType: .default,
            authorizationButtonStyle: .black
        )
        button.addTarget(
            context.coordinator,
            action: #selector(Coordinator.didTapButton),
            for: .touchUpInside
        )
        return button
    }
    
    func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onRequest: onRequest, onCompletion: onCompletion)
    }
    
    class Coordinator: NSObject {
        var onRequest: (ASAuthorizationAppleIDRequest) -> Void
        var onCompletion: (Result<ASAuthorization, Error>) -> Void
        
        init(
            onRequest: @escaping (ASAuthorizationAppleIDRequest) -> Void,
            onCompletion: @escaping (Result<ASAuthorization, Error>) -> Void
        ) {
            self.onRequest = onRequest
            self.onCompletion = onCompletion
        }
        
        @objc func didTapButton() {
            let request = ASAuthorizationAppleIDProvider().createRequest()
            onRequest(request)
            
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension Coordinator: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            onCompletion(.success(authorization))
        }
    }
    
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        onCompletion(.failure(error))
    }
}

extension Coordinator: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return UIWindow()
    }
}
```

**StoreKit（内购）**

```swift
import StoreKit

class PurchaseManager: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    
    private let productIds = [
        "com.investdiary.stamps.5",
        "com.investdiary.stamps.10",
        "com.investdiary.stamps.20",
        "com.investdiary.stamps.50"
    ]
    
    private var updateListenerTask: Task<Void, Error>?
    
    init() {
        updateListenerTask = listenForTransactions()
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    func loadProducts() async throws {
        let request = Product.productsRequest(for: productIds)
        self.products = try await request.products
    }
    
    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updatePurchasedProductIDs()
            await transaction.finish()
            return transaction
        case .userCancelled, .pending:
            return nil
        default:
            return nil
        }
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.updatePurchasedProductIDs()
                    await transaction.finish()
                } catch {
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified:
            throw TransactionError.verificationFailed
        }
    }
    
    private func updatePurchasedProductIDs() async {
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                purchasedProductIDs.insert(transaction.productID)
            } catch {
                print("Failed to verify transaction: \(error)")
            }
        }
    }
}

enum TransactionError: Error {
    case verificationFailed
    case productNotFound
}
```

**APNs（推送通知）**

```swift
import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    
    func requestAuthorization() async -> Bool {
        let settings = await UNUserNotificationCenter.current()
            .notificationSettings()
        
        if settings.authorizationStatus == .authorized {
            return true
        }
        
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            return granted
        } catch {
            print("Failed to request notification authorization: \(error)")
            return false
        }
    }
    
    func scheduleNotification(
        title: String,
        body: String,
        timeInterval: TimeInterval
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: timeInterval,
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            }
        }
    }
    
    func removePendingNotifications() {
        UNUserNotificationCenter.current()
            .removeAllPendingNotificationRequests()
    }
}
```

---

## 六、测试计划

### 6.1 单元测试

**测试框架**

使用XCTest框架进行单元测试，覆盖率不低于80%。

**测试策略**

1. **UseCase测试**
   - 测试业务逻辑
   - 测试边界条件
   - 测试错误处理

2. **ViewModel测试**
   - 测试状态变化
   - 测试用户交互
   - 测试错误处理

3. **Repository测试**
   - 测试数据访问
   - 测试缓存逻辑
   - 测试错误处理

**测试示例**

```swift
import XCTest
@testable import InvestDiary

class LoginUseCaseTests: XCTestCase {
    var sut: LoginUseCase!
    var mockUserRepository: MockUserRepository!
    var mockAuthRepository: MockAuthRepository!
    
    override func setUp() {
        super.setUp()
        mockUserRepository = MockUserRepository()
        mockAuthRepository = MockAuthRepository()
        sut = LoginUseCase(
            userRepository: mockUserRepository,
            authRepository: mockAuthRepository
        )
    }
    
    override func tearDown() {
        sut = nil
        mockUserRepository = nil
        mockAuthRepository = nil
        super.tearDown()
    }
    
    func testLoginWithAppleID_Success() {
        // Given
        let expectedUser = User(id: "1", name: "Test User")
        mockAuthRepository.loginWithAppleIDResult = Just(expectedUser)
            .setFailureType(to: Error.self)
            .eraseToAnyPublisher()
        
        // When
        let result = sut.executeWithAppleID()
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { user in
                    // Then
                    XCTAssertEqual(user.id, expectedUser.id)
                    XCTAssertEqual(user.name, expectedUser.name)
                }
            )
        
        wait(for: [XCTestExpectation()], timeout: 1.0)
    }
    
    func testLoginWithAppleID_Failure() {
        // Given
        let expectedError = NSError(domain: "test", code: -1, userInfo: nil)
        mockAuthRepository.loginWithAppleIDResult = Fail(error: expectedError)
            .eraseToAnyPublisher()
        
        // When
        let expectation = XCTestExpectation(description: "Login fails")
        var receivedError: Error?
        
        sut.executeWithAppleID()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        receivedError = error
                    }
                    expectation.fulfill()
                },
                receiveValue: { _ in }
            )
        
        wait(for: [expectation], timeout: 1.0)
        
        // Then
        XCTAssertNotNil(receivedError)
    }
}

class MockUserRepository: UserRepositoryProtocol {
    var saveUserResult: AnyPublisher<Void, Error>!
    
    func saveUser(_ user: User) -> AnyPublisher<Void, Error> {
        return saveUserResult
    }
}

class MockAuthRepository: AuthRepositoryProtocol {
    var loginWithAppleIDResult: AnyPublisher<User, Error>!
    var loginWithEmailResult: AnyPublisher<User, Error>!
    
    func loginWithAppleID() -> AnyPublisher<User, Error> {
        return loginWithAppleIDResult
    }
    
    func loginWithEmail(email: String, password: String) -> AnyPublisher<User, Error> {
        return loginWithEmailResult
    }
}
```

### 6.2 集成测试

**测试策略**

1. **API集成测试**
   - 测试API接口
   - 测试数据格式
   - 测试错误处理

2. **数据库集成测试**
   - 测试数据存储
   - 测试数据查询
   - 测试数据更新

**测试示例**

```swift
import XCTest
@testable import InvestDiary

class APIServiceIntegrationTests: XCTestCase {
    var sut: APIService!
    
    override func setUp() {
        super.setUp()
        sut = APIService()
    }
    
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    func testFetchLetters_Success() {
        // Given
        let expectation = XCTestExpectation(description: "Fetch letters")
        
        // When
        sut.fetchLetters()
            .sink(
                receiveCompletion: { completion in
                    if case .finished = completion {
                        expectation.fulfill()
                    }
                },
                receiveValue: { letters in
                    // Then
                    XCTAssertFalse(letters.isEmpty)
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 10.0)
    }
}
```

### 6.3 UI自动化测试

**测试框架**

使用XCUITest框架进行UI自动化测试。

**测试策略**

1. **用户流程测试**
   - 测试登录流程
   - 测试笔记创建流程
   - 测试AI回复流程

2. **UI组件测试**
   - 测试按钮点击
   - 测试文本输入
   - 测试列表滚动

**测试示例**

```swift
import XCTest

class LoginUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    func testLoginWithAppleID() {
        // Given
        let signInButton = app.buttons["SignInWithApple"]
        
        // When
        XCTAssertTrue(signInButton.exists)
        signInButton.tap()
        
        // Then
        let homeView = app.otherElements["HomeView"]
        XCTAssertTrue(homeView.waitForExistence(timeout: 5))
    }
    
    func testLoginWithEmail() {
        // Given
        let emailLoginButton = app.buttons["EmailLogin"]
        let emailField = app.textFields["Email"]
        let passwordField = app.secureTextFields["Password"]
        let loginButton = app.buttons["Login"]
        
        // When
        emailLoginButton.tap()
        emailField.typeText("test@example.com")
        passwordField.typeText("password")
        loginButton.tap()
        
        // Then
        let homeView = app.otherElements["HomeView"]
        XCTAssertTrue(homeView.waitForExistence(timeout: 5))
    }
}
```

### 6.4 性能测试

**测试指标**

1. **启动时间**
   - 冷启动时间：≤2秒
   - 热启动时间：≤1秒

2. **内存占用**
   - 空闲状态：≤50MB
   - 使用状态：≤150MB

3. **CPU使用率**
   - 空闲状态：≤5%
   - 使用状态：≤30%

**测试示例**

```swift
import XCTest

class PerformanceTests: XCTestCase {
    func testLaunchPerformance() {
        measure {
            let app = XCUIApplication()
            app.launch()
        }
    }
    
    func testScrollingPerformance() {
        let app = XCUIApplication()
        app.launch()
        
        measure(metrics: [XCTClockMetric()]) {
            let table = app.tables.firstMatch
            table.swipeUp()
        }
    }
}
```

### 6.5 兼容性测试

**测试范围**

- iOS 13及以上版本
- iPhone 8及以上机型
- iPad（可选）

**测试矩阵**

| iOS版本 | iPhone 8 | iPhone X | iPhone 12 | iPhone 14 |
|---------|----------|----------|-----------|----------|
| iOS 13 | ✓ | ✓ | - | - |
| iOS 14 | ✓ | ✓ | ✓ | - |
| iOS 15 | ✓ | ✓ | ✓ | ✓ |
| iOS 16 | ✓ | ✓ | ✓ | ✓ |

### 6.6 用户体验测试

**测试方法**

1. **可用性测试**
   - 邀请5-10名用户进行测试
   - 观察用户操作流程
   - 收集用户反馈

2. **A/B测试**
   - 测试不同UI设计
   - 测试不同交互方式
   - 分析用户行为数据

3. **Beta测试**
   - 使用TestFlight进行Beta测试
   - 邀请100-200名用户参与
   - 收集Bug和反馈

---

## 七、发布准备与上线流程

### 7.1 App Store上架资料准备清单

**应用信息**

| 项目 | 内容 | 要求 |
|-----|------|-----|
| 应用名称 | 投资笔记 | 最多30字符 |
| 副标题 | 记录心路历程，了解真实的自己 | 最多30字符 |
| 应用图标 | 1024x1024 PNG | 必须提供 |
| 应用截图 | 6.5"和5.5"显示屏 | 至少3张，最多10张 |
| 应用预览 | 15-30秒视频 | 可选 |
| 描述 | 应用功能介绍 | 最多4000字符 |
| 关键词 | 搜索关键词 | 最多100字符 |
| 技术支持网址 | https://investdiary.com/support | 必须提供 |
| 营销网址 | https://investdiary.com | 可选 |
| 隐私政策网址 | https://investdiary.com/privacy | 必须提供 |

**应用分类**

- 主要分类：生产力
- 次要分类：商务

**内容评级**

- 内容评级：4+（无争议内容）
- 描述：不包含暴力、色情、宗教等内容

**定价**

- 免费应用
- 内购项目：
  - 5张邮票：¥5
  - 10张邮票：¥9
  - 20张邮票：¥16
  - 50张邮票：¥35

### 7.2 应用元数据配置

**App Store Connect配置**

1. **创建应用**
   - 登录App Store Connect
   - 点击"我的App"
   - 点击"+"创建新应用

2. **填写应用信息**
   - 平台：iOS
   - 名称：投资笔记
   - 主要语言：简体中文
   - Bundle ID：com.investdiary.ios
   - SKU：INVESTDIARY001

3. **上传应用图标**
   - 尺寸：1024x1024 PNG
   - 格式：PNG
   - 无透明度

4. **上传应用截图**
   - 6.5"显示屏：1242x2688 PNG
   - 5.5"显示屏：1242x2208 PNG
   - 至少3张，最多10张

5. **填写应用描述**
   - 简体中文描述

---

**文档版本**：v0.1版  
**创建日期**：2026-02-22  
**文档大小**：约25000字  
**状态**：待审核
