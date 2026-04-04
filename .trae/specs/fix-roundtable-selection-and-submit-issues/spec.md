# 修复圆桌会议导师选中和提交按钮问题 Spec

## Why
用户反馈圆桌会议页面存在两个核心问题：
1. 导师卡片选中后没有显示预期的棕色背景和文字样式变化
2. 选择3位以上导师并输入内容后，提交按钮仍然不可点击

经过分析，问题根源在于微信小程序的WXML事件绑定不支持动态语法，以及CSS样式优先级冲突导致选中效果不生效。

## What Changes
- 修复按钮事件绑定方式，改为使用静态绑定加内部逻辑判断
- 彻底解决导师选中样式优先级问题，确保选中效果正确显示
- 优化交互逻辑，符合微信小程序最新开发规范

## Impact
-  Affected specs: 圆桌会议页面功能
-  Affected code: 
  - `miniprogram/pages/roundtable/roundtable.wxml` (按钮事件绑定)
  - `miniprogram/pages/roundtable/roundtable.js` (添加事件处理方法)
  - `miniprogram/pages/roundtable/roundtable.wxss` (样式优先级优化)

## ADDED Requirements

### Requirement: 导师选中效果
The system SHALL provide clear visual feedback when a user selects a mentor:
- **WHEN** user clicks on a mentor card
- **THEN** card background changes to brown (#8b4513)
- **THEN** mentor name changes to white and bold
- **THEN** a border and shadow effect is displayed

### Requirement: 提交按钮交互
The system SHALL enable submit button when all conditions are met:
- **WHEN** user selects 3 or more mentors
- **AND** user enters content in the input box
- **THEN** submit button becomes clickable
- **THEN** clicking button triggers the appropriate action based on feature status

## MODIFIED Requirements

### Requirement: Event Binding
**Before**: Dynamic `bindtap` binding was used: `bindtap="{{featureEnabled ? 'submitRoundtable' : 'showFeatureDisabledTip'}}"`
**After**: Static binding with internal logic: `bindtap="handleSubmit"` that checks feature status internally

### Requirement: Style Priority
**Before**: Selected mentor styles were being overridden by other styles
**After**: Selected mentor styles use explicit priority to ensure they are always applied

## REMOVED Requirements
None
