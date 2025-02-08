---
author: binghuis
pubDatetime: 2025-02-07
title: Solidity 数据类型与传递方式
slug: solidity-data-types
featured: false
draft: false
tags:
  - web3
  - solodity
description: 本文简要介绍了 Solidity 数据类型及其传递方式，重点讲解值类型与引用类型的区别，以及数据存储位置对传递方式的影响。
---

不同于 JS，Solidity 是一种静态类型语言，这意味着每个变量都需要被指定类型，且所有未被显式赋值的变量都会有一个默认值。

> Solidity 中不存在 undefined 或 null 的概念。

在 Solidity 中，所有未被显式赋值的变量都会有一个**默认值**（默认初始化值），这适用于**状态变量**和**局部存储变量**（`storage` 变量），但**不适用于局部 `memory` 变量**（`memory` 变量未初始化会导致错误）。

| 数据类型             | 默认值                                       |
| -------------------- | -------------------------------------------- |
| `uint` / `int`       | `0`                                          |
| `bool`               | `false`                                      |
| `address`            | `0x0000000000000000000000000000000000000000` |
| `bytes1` ~ `bytes32` | `0x00...00`（全零）                          |
| `string`             | `""`（空字符串）                             |
| `bytes`              | `""`（空字节数组）                           |
| `enum`               | `0`（即枚举的第一个成员）                    |
| `mapping`            | **所有键的值均为默认值**                     |
| `struct`             | **所有成员均为默认值**                       |
| `array`              | **所有元素均为默认值**                       |

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DefaultValues {
    uint256 public num;       // 默认 0
    bool public flag;         // 默认 false
    address public addr;      // 默认 0x000...000
    bytes32 public b32;       // 默认 0x00...00
    string public str;        // 默认 ""

    enum Status { Pending, Approved, Rejected }
    Status public status;     // 默认 0，即 Status.Pending

    struct Data {
        uint256 id;
        bool active;
    }
    Data public data;         // id 默认 0，active 默认 false

    mapping(address => uint256) public balances; // 所有地址的默认余额为 0
}
```

Solidity 数据类型分为值类型和引用类型

> 之所以被称为值类型，是因为它们的变量总是通过值传递，即在用作函数参数或赋值时总是被复制。

值类型包括布尔类型（bool）。
整型
