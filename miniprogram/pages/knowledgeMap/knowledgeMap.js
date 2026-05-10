var cloudbaseUtil = require('../../utils/cloudbaseUtil');
var dbCmd = wx.cloud.database().command;
var app = getApp();

// 领域配置
var DOMAINS = [
  { id: 'value', name: '价值思维', icon: '💰', color: '#8b4513',
    methods: ['多元思维模型分析', '价值投资分析框架', '安全边际分析'] },
  { id: 'innovation', name: '创新创业', icon: '🚀', color: '#2ecc71',
    methods: ['本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析'] },
  { id: 'psychology', name: '心理学', icon: '🧠', color: '#9b59b6',
    methods: ['原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析'] },
  { id: 'philosophy', name: '哲学', icon: '📖', color: '#34495e',
    methods: ['道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析'] }
];

// 布局参数
var DOMAIN_RADIUS = 280;
var METHOD_RADIUS = 100;
var ANALYSIS_SPREAD = 60;
var NODE_SIZES = {
  domain: { w: 120, h: 60 },
  method: { w: 90, h: 36 },
  analysis: { w: 60, h: 28 }
};

Page({
  data: {
    loading: true,
    themeClass: '',
    fontClass: '',
    viewMode: 'graph',  // graph / cluster / timeline
    selectedNode: null,
    showDetail: false,
    detailInfo: null,
    showInsights: false,
    insights: null,
    insightsLoading: false,
    connections: [],
    showConnectionReason: false,
    connectionReason: '',
    showMindmapOverlay: false,
    mindmapData: null,
    mindmapSourceNode: null
  },

  // 虚拟坐标系
  _scale: 0.6,
  _offsetX: 0,
  _offsetY: 0,
  _canvas: null,
  _ctx: null,
  _canvasWidth: 0,
  _canvasHeight: 0,
  _dpr: 1,
  _nodes: [],
  _edges: [],
  _touchStartX: 0,
  _touchStartY: 0,
  _touchStartOffsetX: 0,
  _touchStartOffsetY: 0,
  _touchStartDist: 0,
  _touchStartScale: 1,
  _isDragging: false,
  _lastTapTime: 0,
  _connectionEdges: [],
  _highlightNodes: {},

  onLoad: function () {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  onReady: function () {
    this.loadKnowledgeData();
  },

  initCanvas: function () {
    var self = this;
    var query = this.createSelectorQuery();
    query.select('#knowledgeCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          // canvas 尚未渲染，延迟重试
          setTimeout(function() { self.initCanvas(); }, 100);
          return;
        }
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getWindowInfo().pixelRatio;
        var displayWidth = res[0].width;
        var displayHeight = res[0].height;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);

        self._canvas = canvas;
        self._ctx = ctx;
        self._canvasWidth = displayWidth;
        self._canvasHeight = displayHeight;
        self._dpr = dpr;

        // 居中视图
        self._offsetX = displayWidth / 2;
        self._offsetY = displayHeight / 2;
      });
  },

  loadKnowledgeData: function () {
    var self = this;
    var openid = wx.getStorageSync('openid');
    if (!openid) {
      this.setData({ loading: false });
      return;
    }

    // 并行加载所有类型的分析记录
    var promises = [
      cloudbaseUtil.query('letters', {
        where: { _openid: openid, deleted: dbCmd.neq(true) },
        orderBy: 'createTime', orderDirection: 'desc', limit: 200
      }),
      cloudbaseUtil.query('roundtable_discussions', {
        where: { _openid: openid },
        orderBy: 'createTime', orderDirection: 'desc', limit: 100
      }),
      cloudbaseUtil.query('incubator_reports', {
        where: { _openid: openid },
        orderBy: 'createTime', orderDirection: 'desc', limit: 100
      }),
      cloudbaseUtil.query('structure_analysis_reports', {
        where: { _openid: openid },
        orderBy: 'createTime', orderDirection: 'desc', limit: 100
      })
    ];

    Promise.all(promises).then(function (results) {
      var letters = results[0].success ? results[0].data : [];
      var roundtables = results[1].success ? results[1].data : [];
      var incubators = results[2].success ? results[2].data : [];
      var structureAnalyses = results[3].success ? results[3].data : [];

      self.buildGraph(letters, roundtables, incubators, structureAnalyses);
      self.setData({ loading: false }, function () {
        // loading=false 后 canvas 才渲染到 DOM，此时初始化并绘制
        self.initCanvas();
        setTimeout(function () { self.render(); }, 100);
      });
      // 后台加载关联数据和知识洞察
      self.loadConnections();
      self.loadInsights({ auto: true });
    }).catch(function (err) {
      console.error('加载知识数据失败:', err);
      self.setData({ loading: false });
    });
  },

  buildGraph: function (letters, roundtables, incubators, structureAnalyses) {
    var nodes = [];
    var edges = [];
    var methodToDomain = {};

    // 建立方法→领域映射
    DOMAINS.forEach(function (d) {
      d.methods.forEach(function (m) {
        methodToDomain[m] = d.id;
      });
    });

    // 1. 领域节点（固定位置，画布中心周围）
    var domainPositions = [
      { x: -DOMAIN_RADIUS, y: -DOMAIN_RADIUS },
      { x: DOMAIN_RADIUS, y: -DOMAIN_RADIUS },
      { x: -DOMAIN_RADIUS, y: DOMAIN_RADIUS },
      { x: DOMAIN_RADIUS, y: DOMAIN_RADIUS }
    ];

    DOMAINS.forEach(function (domain, i) {
      nodes.push({
        id: 'domain_' + domain.id,
        type: 'domain',
        name: domain.name,
        icon: domain.icon,
        color: domain.color,
        x: domainPositions[i].x,
        y: domainPositions[i].y,
        size: NODE_SIZES.domain,
        analysisCount: 0
      });
    });

    // 2. 方法节点（围绕领域圆形排列）
    DOMAINS.forEach(function (domain) {
      var domainNode = nodes.find(function (n) { return n.id === 'domain_' + domain.id; });
      var centerX = domainNode.x;
      var centerY = domainNode.y;
      var methodCount = domain.methods.length;

      domain.methods.forEach(function (methodName, mi) {
        var angle = (2 * Math.PI / methodCount) * mi - Math.PI / 2;
        var mx = centerX + Math.cos(angle) * METHOD_RADIUS;
        var my = centerY + Math.sin(angle) * METHOD_RADIUS;

        var methodNodeId = 'method_' + domain.id + '_' + mi;
        nodes.push({
          id: methodNodeId,
          type: 'method',
          name: methodName,
          domainId: domain.id,
          color: domain.color,
          x: mx,
          y: my,
          size: NODE_SIZES.method,
          analysisCount: 0
        });

        edges.push({
          from: 'domain_' + domain.id,
          to: methodNodeId,
          color: domain.color,
          type: 'domain-method'
        });
      });
    });

    // 3. 分析记录节点（散布在对应方法附近）
    letters.forEach(function (letter, li) {
      var methodName = letter.mentor || '';
      var domainId = methodToDomain[methodName];
      if (!domainId) return;

      // 找到对应方法节点
      var methodNodes = nodes.filter(function (n) {
        return n.type === 'method' && n.name === methodName;
      });
      if (methodNodes.length === 0) return;

      var methodNode = methodNodes[0];
      var offsetX = (Math.random() - 0.5) * ANALYSIS_SPREAD * 2;
      var offsetY = (Math.random() - 0.5) * ANALYSIS_SPREAD * 2 + METHOD_RADIUS * 0.6;

      var analysisNodeId = 'analysis_' + letter._id;
      nodes.push({
        id: analysisNodeId,
        type: 'analysis',
        name: (letter.content || '').substring(0, 12),
        fullContent: letter.replyContent || letter.content,
        userContent: letter.content,
        methodName: methodName,
        recordId: letter._id,
        color: methodNode.color,
        x: methodNode.x + offsetX,
        y: methodNode.y + offsetY,
        size: NODE_SIZES.analysis,
        createTime: letter.createTime
      });

      edges.push({
        from: methodNode.id,
        to: analysisNodeId,
        color: methodNode.color,
        type: 'method-analysis'
      });

      // 更新计数
      methodNode.analysisCount = (methodNode.analysisCount || 0) + 1;
      var domainNode = nodes.find(function (n) { return n.id === 'domain_' + domainId; });
      if (domainNode) domainNode.analysisCount = (domainNode.analysisCount || 0) + 1;
    });

    // 4. 多维度分析节点
    roundtables.forEach(function (rt) {
      var methods = rt.mentors || [];
      if (methods.length === 0) return;

      var rtNodeId = 'roundtable_' + rt._id;
      var firstMethod = methods[0];
      var domainId = methodToDomain[firstMethod];
      var domainColor = '#e67e22';
      if (domainId) {
        var dn = nodes.find(function (n) { return n.id === 'domain_' + domainId; });
        if (dn) domainColor = dn.color;
      }

      var anchorNode = nodes.find(function (n) { return n.type === 'method' && n.name === firstMethod; });
      var baseX = anchorNode ? anchorNode.x : 0;
      var baseY = anchorNode ? anchorNode.y + ANALYSIS_SPREAD * 1.5 : 0;

      nodes.push({
        id: rtNodeId,
        type: 'roundtable',
        name: (rt.content || '').substring(0, 12),
        fullContent: rt.summary || rt.content || '',
        methodName: '多维度分析',
        recordId: rt._id,
        color: '#e67e22',
        x: baseX + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        y: baseY + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        size: { w: 65, h: 30 },
        createTime: rt.createTime
      });

      methods.forEach(function (m) {
        var mNode = nodes.find(function (n) { return n.type === 'method' && n.name === m; });
        if (mNode) {
          edges.push({ from: mNode.id, to: rtNodeId, color: '#e67e22', type: 'method-analysis' });
          mNode.analysisCount = (mNode.analysisCount || 0) + 1;
        }
      });
    });

    // 5. 孵化器节点
    incubators.forEach(function (inc) {
      var methods = inc.methods || [];
      if (methods.length === 0) return;

      var incNodeId = 'incubator_' + inc._id;
      var firstMethod = methods[0];
      var domainId = methodToDomain[firstMethod];

      var anchorNode = nodes.find(function (n) { return n.type === 'method' && n.name === firstMethod; });
      var baseX = anchorNode ? anchorNode.x : 0;
      var baseY = anchorNode ? anchorNode.y + ANALYSIS_SPREAD * 1.8 : 0;

      nodes.push({
        id: incNodeId,
        type: 'incubator',
        name: (inc.content || '').substring(0, 12),
        fullContent: inc.report || inc.content || '',
        methodName: '思想孵化器',
        recordId: inc._id,
        color: '#9b59b6',
        x: baseX + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        y: baseY + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        size: { w: 65, h: 30 },
        createTime: inc.createTime
      });

      methods.forEach(function (m) {
        var mNode = nodes.find(function (n) { return n.type === 'method' && n.name === m; });
        if (mNode) {
          edges.push({ from: mNode.id, to: incNodeId, color: '#9b59b6', type: 'method-analysis' });
          mNode.analysisCount = (mNode.analysisCount || 0) + 1;
        }
      });
    });

    // 6. 结构分析节点
    structureAnalyses.forEach(function (sa) {
      var saNodeId = 'structure_' + sa._id;
      var domainId = sa.analysisType === 'product' ? 'value' : 'innovation';
      var domainColor = '#2ecc71';

      var anchorNode = nodes.find(function (n) { return n.id === 'domain_' + domainId; });
      var baseX = anchorNode ? anchorNode.x : 0;
      var baseY = anchorNode ? anchorNode.y + ANALYSIS_SPREAD * 2 : 0;

      nodes.push({
        id: saNodeId,
        type: 'structure',
        name: (sa.content || '').substring(0, 12),
        fullContent: sa.report || sa.content || '',
        methodName: sa.analysisType === 'product' ? '产品分析' : '公司分析',
        recordId: sa._id,
        color: domainColor,
        x: baseX + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        y: baseY + (Math.random() - 0.5) * ANALYSIS_SPREAD,
        size: { w: 65, h: 30 },
        createTime: sa.createTime
      });

      edges.push({ from: 'domain_' + domainId, to: saNodeId, color: domainColor, type: 'method-analysis' });
    });

    this._nodes = nodes;
    this._edges = edges;
  },

  render: function () {
    var ctx = this._ctx;
    if (!ctx) return;

    var W = this._canvasWidth;
    var H = this._canvasHeight;
    var scale = this._scale;
    var ox = this._offsetX;
    var oy = this._offsetY;
    var self = this;

    // 清屏
    var bgColor = app.getTheme() === 'dark' ? '#1a1a2e' : '#f8f9fa';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // 绘制网格背景（微弱）
    this._drawGrid(ctx, W, H, scale, ox, oy);

    // 绘制结构连线
    this._edges.forEach(function (edge) {
      var fromNode = this._nodes.find(function (n) { return n.id === edge.from; });
      var toNode = this._nodes.find(function (n) { return n.id === edge.to; });
      if (!fromNode || !toNode) return;
      if (fromNode._hidden || toNode._hidden) return;
      this._drawEdge(ctx, fromNode, toNode, edge, scale, ox, oy);
    }.bind(this));

    // H3: 绘制跨分析关联线（虚线，橙色）
    if (this._connectionEdges.length > 0 && scale > 0.3) {
      var isDark = app.getTheme() === 'dark';
      this._connectionEdges.forEach(function (conn) {
        var fromNode = self._nodes.find(function (n) { return n.id === 'analysis_' + conn.fromId; });
        var toNode = self._nodes.find(function (n) { return n.id === 'analysis_' + conn.toId; });
        if (!fromNode || !toNode) return;
        var fx = fromNode.x * scale + ox;
        var fy = fromNode.y * scale + oy;
        var tx = toNode.x * scale + ox;
        var ty = toNode.y * scale + oy;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = isDark ? 'rgba(230, 126, 34, 0.3)' : 'rgba(230, 126, 34, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 渲染节点（带高亮）
    var highlightNodes = this._highlightNodes || {};
    this._nodes.forEach(function (node) {
      if (node._hidden) return;
      // 非高亮模式下降低非关联节点透明度
      var dimmed = Object.keys(highlightNodes).length > 0 && !highlightNodes[node.id];
      this._drawNode(ctx, node, scale, ox, oy, dimmed);
    }.bind(this));
  },

  _drawGrid: function (ctx, W, H, scale, ox, oy) {
    var gridSize = 50;
    var isDark = app.getTheme() === 'dark';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 0.5;

    var startX = (ox % (gridSize * scale));
    var startY = (oy % (gridSize * scale));

    for (var x = startX; x < W; x += gridSize * scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (var y = startY; y < H; y += gridSize * scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  },

  _drawEdge: function (ctx, from, to, edge, scale, ox, oy) {
    var fx = from.x * scale + ox;
    var fy = from.y * scale + oy;
    var tx = to.x * scale + ox;
    var ty = to.y * scale + oy;

    // LOD: 太远时不绘制 method-analysis 连线
    if (edge.type === 'method-analysis' && scale < 0.4) return;

    var isDark = app.getTheme() === 'dark';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);

    if (edge.type === 'method-analysis') {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
    } else {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },

  _drawNode: function (ctx, node, scale, ox, oy, dimmed) {
    var x = node.x * scale + ox;
    var y = node.y * scale + oy;
    var isDark = app.getTheme() === 'dark';

    // LOD: 根据缩放级别决定渲染精度
    if ((node.type === 'analysis' || node.type === 'roundtable' || node.type === 'incubator' || node.type === 'structure') && scale < 0.35) return;
    if (node.type === 'method' && scale < 0.2) return;

    // 非关联节点降低透明度
    if (dimmed) {
      ctx.globalAlpha = 0.25;
    }

    var isSelected = this.data.selectedNode && this.data.selectedNode.id === node.id;

    if (node.type === 'domain') {
      this._drawDomainNode(ctx, x, y, node, scale, isDark, isSelected);
    } else if (node.type === 'method') {
      this._drawMethodNode(ctx, x, y, node, scale, isDark, isSelected);
    } else {
      // analysis / roundtable / incubator / structure 统一渲染
      this._drawAnalysisNode(ctx, x, y, node, scale, isDark, isSelected);
    }

    if (dimmed) {
      ctx.globalAlpha = 1.0;
    }
  },

  _drawDomainNode: function (ctx, x, y, node, scale, isDark, isSelected) {
    var r = Math.max(8, 28 * scale);

    // 背景圆
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? node.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)');
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#2a2a4a' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 2 * Math.min(scale, 1);
    ctx.stroke();

    // 图标
    if (scale > 0.3) {
      ctx.font = Math.max(10, 16 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(node.icon, x, y - 4 * scale);
    }

    // 名称
    if (scale > 0.35) {
      ctx.font = 'bold ' + Math.max(8, 12 * scale) + 'px sans-serif';
      ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
      ctx.fillText(node.name, x, y + 10 * scale);
    }

    // 计数
    if (scale > 0.5 && node.analysisCount > 0) {
      ctx.font = Math.max(7, 9 * scale) + 'px sans-serif';
      ctx.fillStyle = isDark ? '#999' : '#888';
      ctx.fillText(node.analysisCount + '篇', x, y + 22 * scale);
    }
  },

  _drawMethodNode: function (ctx, x, y, node, scale, isDark, isSelected) {
    var r = Math.max(4, 14 * scale);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? node.color : (isDark ? '#3a3a5a' : '#f0f0f0');
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 1.5 * Math.min(scale, 1);
    ctx.stroke();

    // 方法名称
    if (scale > 0.45) {
      var fontSize = Math.max(7, 10 * scale);
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDark ? '#ccc' : '#555';

      // 截断名称
      var name = node.name;
      if (name.length > 8 && scale < 0.7) {
        name = name.substring(0, 7) + '...';
      }
      ctx.fillText(name, x, y + r + 2);
    }
  },

  _drawAnalysisNode: function (ctx, x, y, node, scale, isDark, isSelected) {
    var r = Math.max(3, 8 * scale);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? node.color : node.color + '66';
    ctx.fill();

    // 分析摘要
    if (scale > 0.7) {
      var fontSize = Math.max(6, 8 * scale);
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDark ? '#aaa' : '#777';
      ctx.fillText(node.name, x, y + r + 2);
    }
  },

  // 手势处理
  onTouchStart: function (e) {
    if (e.touches.length === 1) {
      this._touchStartX = e.touches[0].x;
      this._touchStartY = e.touches[0].y;
      this._touchStartOffsetX = this._offsetX;
      this._touchStartOffsetY = this._offsetY;
      this._isDragging = false;
    } else if (e.touches.length === 2) {
      var dx = e.touches[1].x - e.touches[0].x;
      var dy = e.touches[1].y - e.touches[0].y;
      this._touchStartDist = Math.sqrt(dx * dx + dy * dy);
      this._touchStartScale = this._scale;
    }
  },

  onTouchMove: function (e) {
    if (e.touches.length === 1) {
      var dx = e.touches[0].x - this._touchStartX;
      var dy = e.touches[0].y - this._touchStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this._isDragging = true;
      }
      this._offsetX = this._touchStartOffsetX + dx;
      this._offsetY = this._touchStartOffsetY + dy;
      this.render();
    } else if (e.touches.length === 2) {
      var ddx = e.touches[1].x - e.touches[0].x;
      var ddy = e.touches[1].y - e.touches[0].y;
      var dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (this._touchStartDist > 0) {
        var newScale = this._touchStartScale * (dist / this._touchStartDist);
        newScale = Math.max(0.15, Math.min(2.0, newScale));
        this._scale = newScale;
        this.render();
      }
    }
  },

  onTouchEnd: function (e) {
    if (!this._isDragging && e.changedTouches.length === 1) {
      var tapX = e.changedTouches[0].x;
      var tapY = e.changedTouches[0].y;
      this._handleTap(tapX, tapY);
    }

    // 双击检测
    var now = Date.now();
    if (now - this._lastTapTime < 300) {
      this._handleDoubleTap(e.changedTouches[0].x, e.changedTouches[0].y);
    }
    this._lastTapTime = now;
  },

  _handleTap: function (tapX, tapY) {
    var scale = this._scale;
    var ox = this._offsetX;
    var oy = this._offsetY;

    // 查找点击到的节点
    var hitNode = null;
    for (var i = this._nodes.length - 1; i >= 0; i--) {
      var node = this._nodes[i];
      var nx = node.x * scale + ox;
      var ny = node.y * scale + oy;
      var hitRadius = 0;

      if (node.type === 'domain') hitRadius = 30 * scale;
      else if (node.type === 'method') hitRadius = 18 * scale;
      else hitRadius = 12 * scale;

      var dx = tapX - nx;
      var dy = tapY - ny;
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      this.setData({ selectedNode: hitNode, showDetail: true, detailInfo: this._buildDetail(hitNode) });
      this._highlightRelated(hitNode.id);
    } else {
      this.setData({ selectedNode: null, showDetail: false, detailInfo: null });
      this._clearHighlight();
    }
    this.render();
  },

  _handleDoubleTap: function (tapX, tapY) {
    var scale = this._scale;
    var ox = this._offsetX;
    var oy = this._offsetY;

    for (var i = this._nodes.length - 1; i >= 0; i--) {
      var node = this._nodes[i];
      var nx = node.x * scale + ox;
      var ny = node.y * scale + oy;
      var hitRadius = node.type === 'domain' ? 30 * scale : 18 * scale;
      var dx = tapX - nx;
      var dy = tapY - ny;
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        if (node.type === 'analysis' || node.type === 'roundtable' || node.type === 'incubator' || node.type === 'structure') {
          // 双击分析记录 → Flipbook 深入探索
          this._showExploreOptions(node);
        } else {
          // 领域/方法节点 → 聚焦
          var newScale = node.type === 'domain' ? 0.8 : 1.2;
          this._scale = newScale;
          this._offsetX = this._canvasWidth / 2 - node.x * newScale;
          this._offsetY = this._canvasHeight / 2 - node.y * newScale;
          this.render();
        }
        return;
      }
    }
  },

  // H5: Flipbook 深入探索 — 显示选项
  _showExploreOptions: function (node) {
    var self = this;
    wx.showActionSheet({
      itemList: ['查看脑图', '深入探索（生成新分析）'],
      success: function (res) {
        if (res.tapIndex === 0) {
          self._expandMindmap(node);
        } else if (res.tapIndex === 1) {
          self._deepExplore(node);
        }
      }
    });
  },

  // H5: 展开分析记录的脑图
  _expandMindmap: function (node) {
    if (!node.recordId) return;
    var self = this;

    wx.showLoading({ title: '生成脑图...' });

    wx.cloud.callFunction({
      name: 'replyToLetter',
      data: {
        type: 'mindmap',
        analysisContent: node.fullContent || '',
        methodName: node.methodName || '分析方法'
      }
    }).then(function (res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.success && result.data) {
        self.setData({
          showMindmapOverlay: true,
          mindmapData: result.data,
          mindmapSourceNode: node
        });
        // 保存脑图到本地历史
        self._saveMindmapHistory(result.data, node);
      } else {
        wx.showToast({ title: '脑图生成失败', icon: 'none' });
      }
    }).catch(function (err) {
      wx.hideLoading();
      console.error('脑图生成失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  },

  // H5: Flipbook 深入探索 — 生成新分析
  _deepExplore: function (node) {
    if (!node.fullContent) {
      wx.showToast({ title: '无分析内容可探索', icon: 'none' });
      return;
    }
    var self = this;

    var content = node.fullContent;
    var methodName = node.methodName || '分析方法';

    wx.showLoading({ title: '深入探索中...' });

    wx.cloud.callFunction({
      name: 'replyToLetter',
      data: {
        type: 'deepexplore',
        sourceContent: content,
        sourceMethod: methodName
      }
    }).then(function (res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.success && result.data) {
        var exploreResult = result.data;
        self._addExplorationNode(node, exploreResult);
      } else {
        wx.showToast({ title: result.message || '探索失败，请重试', icon: 'none' });
      }
    }).catch(function (err) {
      wx.hideLoading();
      console.error('深入探索失败:', err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    });
  },

  // 将探索结果添加到图谱画布
  _addExplorationNode: function (sourceNode, exploreResult) {
    var offsetX = (Math.random() - 0.5) * 80 + 120;
    var offsetY = (Math.random() - 0.5) * 80;

    var newNodeId = 'explore_' + Date.now();
    var newNode = {
      id: newNodeId,
      type: 'analysis',
      name: (exploreResult.title || '深入探索').substring(0, 12),
      fullContent: exploreResult.content || '',
      methodName: exploreResult.method || sourceNode.methodName,
      recordId: exploreResult.recordId || null,
      color: '#e67e22',
      x: sourceNode.x + offsetX,
      y: sourceNode.y + offsetY,
      size: { w: 60, h: 28 },
      createTime: Date.now()
    };

    this._nodes.push(newNode);
    this._edges.push({
      from: sourceNode.id,
      to: newNodeId,
      color: '#e67e22',
      type: 'method-analysis'
    });

    // 平滑过渡到新节点
    this._animateToNode(newNode);

    wx.showToast({ title: '已添加新探索', icon: 'success' });
  },

  // 平滑动画：移到新节点位置
  _animateToNode: function (node) {
    var self = this;
    var targetScale = 0.9;
    var targetOX = this._canvasWidth / 2 - node.x * targetScale;
    var targetOY = this._canvasHeight / 2 - node.y * targetScale;
    var startScale = this._scale;
    var startOX = this._offsetX;
    var startOY = this._offsetY;
    var steps = 15;
    var step = 0;

    function animate() {
      step++;
      var t = step / steps;
      // easeOut
      t = 1 - Math.pow(1 - t, 3);
      self._scale = startScale + (targetScale - startScale) * t;
      self._offsetX = startOX + (targetOX - startOX) * t;
      self._offsetY = startOY + (targetOY - startOY) * t;
      self.render();
      if (step < steps) {
        setTimeout(animate, 20);
      }
    }
    animate();
  },

  // 关闭脑图覆盖层
  closeMindmapOverlay: function () {
    this.setData({ showMindmapOverlay: false, mindmapData: null });
  },

  // 从脑图覆盖层发起深入探索
  exploreFromMindmap: function () {
    var sourceNode = this.data.mindmapSourceNode;
    this.setData({ showMindmapOverlay: false });
    if (sourceNode) {
      this._deepExplore(sourceNode);
    }
  },

  _buildDetail: function (node) {
    if (node.type === 'domain') {
      var methodNodes = this._nodes.filter(function (n) {
        return n.type === 'method' && n.domainId === node.id.replace('domain_', '');
      });
      return {
        type: 'domain',
        name: node.name,
        icon: node.icon,
        color: node.color,
        analysisCount: node.analysisCount || 0,
        methodCount: methodNodes.length,
        methods: methodNodes.map(function (m) { return m.name; })
      };
    }

    if (node.type === 'method') {
      return {
        type: 'method',
        name: node.name,
        color: node.color,
        analysisCount: node.analysisCount || 0
      };
    }

    if (node.type === 'analysis' || node.type === 'roundtable' || node.type === 'incubator' || node.type === 'structure') {
      return {
        type: node.type,
        name: node.name,
        fullContent: node.fullContent,
        methodName: node.methodName,
        recordId: node.recordId,
        color: node.color
      };
    }

    return null;
  },

  // UI 操作
  closeDetail: function () {
    this.setData({ showDetail: false, selectedNode: null, detailInfo: null });
    this._clearHighlight();
    this.render();
  },

  goToDetail: function () {
    var detail = this.data.detailInfo;
    if (!detail || !detail.recordId) return;
    // 根据节点类型跳转到对应结果页
    if (detail.type === 'roundtable') {
      wx.navigateTo({ url: '../roundtableResult/roundtableResult?id=' + detail.recordId });
    } else if (detail.type === 'incubator') {
      wx.navigateTo({ url: '../incubatorResult/incubatorResult?id=' + detail.recordId });
    } else if (detail.type === 'structure') {
      wx.navigateTo({ url: '../structureAnalysisResult/structureAnalysisResult?id=' + detail.recordId });
    } else {
      wx.navigateTo({ url: '../detail/detail?id=' + detail.recordId });
    }
  },

  // 从详情面板直接生成脑图
  viewMindmapFromDetail: function () {
    var node = this.data.selectedNode;
    if (!node) return;
    this.setData({ showDetail: false });
    this._expandMindmap(node);
  },

  goToMethod: function () {
    var detail = this.data.detailInfo;
    if (!detail || !detail.name) return;
    wx.navigateTo({
      url: '../write/write?preselectMethod=' + encodeURIComponent(detail.name)
    });
  },

  goToDomain: function () {
    var detail = this.data.detailInfo;
    if (!detail || detail.type !== 'domain') return;
    var domainId = '';
    DOMAINS.forEach(function (d) {
      if (d.name === detail.name) domainId = d.id;
    });
    if (domainId) {
      wx.navigateTo({
        url: '../domainDetail/domainDetail?domain=' + domainId
      });
    }
  },

  resetView: function () {
    this._scale = 0.6;
    this._offsetX = this._canvasWidth / 2;
    this._offsetY = this._canvasHeight / 2;
    this.setData({ selectedNode: null, showDetail: false });
    this.render();
  },

  switchViewMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode });
    if (mode === 'graph') {
      this.resetView();
    } else if (mode === 'cluster') {
      this._applyClusterLayout();
    } else if (mode === 'timeline') {
      this._applyTimelineLayout();
    }
    this.render();
  },

  _applyClusterLayout: function () {
    // 领域节点更分散，方法围绕领域更紧凑
    var domainPositions = [
      { x: -350, y: -250 },
      { x: 350, y: -250 },
      { x: -350, y: 250 },
      { x: 350, y: 250 }
    ];

    DOMAINS.forEach(function (domain, i) {
      var domainNode = this._nodes.find(function (n) { return n.id === 'domain_' + domain.id; });
      if (!domainNode) return;
      domainNode.x = domainPositions[i].x;
      domainNode.y = domainPositions[i].y;
    }.bind(this));

    this._nodes.forEach(function (node) {
      if (node.type === 'method') {
        var domainId = node.domainId;
        var domainNode = this._nodes.find(function (n) { return n.id === 'domain_' + domainId; });
        if (!domainNode) return;
        // 重新计算方法位置
        var methodNodes = this._nodes.filter(function (n) { return n.type === 'method' && n.domainId === domainId; });
        var idx = methodNodes.indexOf(node);
        var angle = (2 * Math.PI / methodNodes.length) * idx - Math.PI / 2;
        node.x = domainNode.x + Math.cos(angle) * 80;
        node.y = domainNode.y + Math.sin(angle) * 80;
      }
    }.bind(this));

    this._scale = 0.5;
    this._offsetX = this._canvasWidth / 2;
    this._offsetY = this._canvasHeight / 2;
  },

  _applyTimelineLayout: function () {
    // 按时间从左到右排列分析记录
    var analysisNodes = this._nodes.filter(function (n) { return n.type === 'analysis'; });
    analysisNodes.sort(function (a, b) { return (a.createTime || 0) - (b.createTime || 0); });

    var startX = -300;
    var spacing = 50;
    analysisNodes.forEach(function (node, i) {
      node.x = startX + i * spacing;
      node.y = (Math.random() - 0.5) * 100;
    });

    // 隐藏领域和方法节点（时间轴模式不需要）
    this._nodes.forEach(function (n) {
      if (n.type === 'domain' || n.type === 'method') {
        n._hidden = true;
      } else {
        n._hidden = false;
      }
    });

    this._scale = 0.8;
    this._offsetX = this._canvasWidth / 2;
    this._offsetY = this._canvasHeight / 2;
  },

  goBack: function () {
    wx.navigateBack();
  },

  // H3: 加载跨分析关联
  loadConnections: function () {
    var self = this;
    wx.cloud.callFunction({
      name: 'discoverConnections',
      data: {}
    }).then(function (res) {
      var result = res.result || {};
      if (result.success && result.data && result.data.length > 0) {
        self._connectionEdges = result.data;
        self.setData({ connections: result.data });
        self.render();
      }
    }).catch(function (err) {
      console.warn('关联分析暂不可用，需部署 discoverConnections 云函数');
    });
  },

  // H4: 加载知识洞察
  loadInsights: function (opts) {
    var self = this;
    var autoLoad = opts && opts.auto;

    // 已有数据时直接展开面板，不重新加载
    if (self.data.insights && self.data.insights.totalAnalyses > 0) {
      self.setData({ showInsights: true });
      return;
    }

    self.setData({ insightsLoading: true, showInsights: autoLoad ? false : true });
    wx.cloud.callFunction({
      name: 'getKnowledgeInsights',
      data: {}
    }).then(function (res) {
      var result = res.result || {};
      if (result.success) {
        self.setData({ insights: result.data, insightsLoading: false });
      } else {
        self.setData({
          insights: { totalAnalyses: 0, usedMethodCount: 0, totalMethodCount: 21, unusedMethods: [], suggestedExplorations: [], topMethods: [], frequentTopics: [] },
          insightsLoading: false
        });
      }
    }).catch(function (err) {
      console.warn('知识洞察暂不可用，需部署 getKnowledgeInsights 云函数');
      self.setData({
        insights: { totalAnalyses: 0, usedMethodCount: 0, totalMethodCount: 21, unusedMethods: [], suggestedExplorations: [], topMethods: [], frequentTopics: [] },
        insightsLoading: false
      });
    });
  },

  closeInsights: function () {
    this.setData({ showInsights: false });
  },

  // 点击推荐探索方向 → 跳转 write 页
  goToSuggestion: function (e) {
    var method = e.currentTarget.dataset.method;
    if (method) {
      wx.navigateTo({
        url: '../write/write?preselectMethod=' + encodeURIComponent(method)
      });
    }
  },

  // 点击未使用方法 → 开始分析
  goToUnusedMethod: function (e) {
    var method = e.currentTarget.dataset.method;
    if (method) {
      wx.navigateTo({
        url: '../write/write?preselectMethod=' + encodeURIComponent(method)
      });
      this.setData({ showInsights: false });
    }
  },

  // H2: 节点高亮 - 找到与选中节点关联的所有节点
  _highlightRelated: function (nodeId) {
    var related = {};
    related[nodeId] = true;
    this._edges.forEach(function (edge) {
      if (edge.from === nodeId) related[edge.to] = true;
      if (edge.to === nodeId) related[edge.from] = true;
    });
    // 关联节点
    this._connectionEdges.forEach(function (conn) {
      if (conn.fromId && nodeId.indexOf(conn.fromId) >= 0) {
        related['analysis_' + conn.toId] = true;
      }
      if (conn.toId && nodeId.indexOf(conn.toId) >= 0) {
        related['analysis_' + conn.fromId] = true;
      }
    });
    this._highlightNodes = related;
  },

  // H2: 清除高亮
  _clearHighlight: function () {
    this._highlightNodes = {};
  },

  // H6: 保存知识图谱截图
  saveSnapshot: function () {
    if (!this._canvas) {
      wx.showToast({ title: '画布未就绪', icon: 'none' });
      return;
    }
    var self = this;
    wx.showLoading({ title: '保存中...' });
    wx.canvasToTempFilePath({
      canvas: self._canvas,
      quality: 1,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.hideLoading();
            wx.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail: function (err) {
            wx.hideLoading();
            if (err.errMsg && err.errMsg.indexOf('auth deny') >= 0) {
              wx.showModal({
                title: '需要授权',
                content: '请在设置中允许访问相册',
                confirmText: '去设置',
                success: function (res) {
                  if (res.confirm) wx.openSetting();
                }
              });
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  },

  // 保存脑图到本地历史记录
  _saveMindmapHistory: function (mindmapData, sourceNode) {
    try {
      var history = wx.getStorageSync('mindmap_history') || [];
      history.unshift({
        id: 'mm_' + Date.now(),
        title: mindmapData.title || (sourceNode.name || '').substring(0, 15),
        methodName: sourceNode.methodName || '分析方法',
        date: Date.now(),
        data: mindmapData
      });
      // 最多保留20条
      if (history.length > 20) history = history.slice(0, 20);
      wx.setStorageSync('mindmap_history', history);
    } catch (e) {
      console.warn('保存脑图历史失败:', e);
    }
  }
});
