---
author: binghuis
pubDatetime: 2025-02-08
title: Solidity 智能合约 Gas 费优化策略
slug: gas-optimization
featured: false
draft: false
tags:
  - web3
  - solodity
description: 本文主要介绍了 Solidity 智能合约 Gas 费的优化策略。
---

在 Solidity 智能合约开发中，Gas 费优化至关重要，尤其是当合约涉及高频交易时。

---

## **1. 存储优化**

EVM 的存储（storage）操作是 Gas 费最高的部分，因此尽量减少 `SSTORE` 操作和 `SLOAD` 读取。

### **1.1 避免存储变量，尽量使用 `memory` 或 `calldata`**

```solidity
// ❌ 差的做法
function bad(uint256[] memory arr) public {
    uint256 length = arr.length; // 读取 storage 变量（高成本）
    for (uint256 i = 0; i < length; i++) {
        arr[i] = arr[i] + 1; // 多次 `SLOAD` 和 `SSTORE`
    }
}

// ✅ 优化后
function good(uint256[] calldata arr) external pure returns (uint256[] memory) {
    uint256[] memory newArr = new uint256[](arr.length);
    for (uint256 i = 0; i < arr.length; i++) {
        newArr[i] = arr[i] + 1; // 操作 memory，降低 Gas
    }
    return newArr;
}
```

✅ **优化点：**

- `storage` 变量的 `SLOAD` 操作成本高，改为 `memory` 或 `calldata` 降低 Gas。

---

### **1.2 变量打包（Packing Optimization）**

Solidity 按 **32 字节（256 位）对 storage 变量对齐**，多个小变量可以**共用存储槽（Slot）**，减少 `SSTORE` 操作。

```solidity
// ❌ 差的做法：每个 uint256 占用一个独立的 storage slot
contract BadPacking {
    uint256 a; // Slot 0
    uint256 b; // Slot 1
}

// ✅ 优化后：使用 uint8 等小数据类型，并合并到一个 slot
contract GoodPacking {
    uint8 a;   // Slot 0
    uint8 b;   // Slot 0 （与 `a` 共享）
    uint256 c; // Slot 1
}
```

✅ **优化点：**

- **`uint8`、`uint16`、`bool` 等小变量打包存储**，减少 `SSTORE` 的存储槽占用。

---

### **1.3 避免重复 `SLOAD` 读取**

```solidity
// ❌ 差的做法：每次 `storage` 变量访问都会触发 `SLOAD` 读取
function bad() public view returns (uint256) {
    uint256 x = someStorageVar;  // `SLOAD`
    return x + someStorageVar;   // 额外 `SLOAD`
}

// ✅ 优化后：使用 `memory` 变量缓存值，减少 `SLOAD`
function good() public view returns (uint256) {
    uint256 x = someStorageVar;  // `SLOAD`
    return x + x;                // 只执行 1 次 `SLOAD`
}
```

✅ **优化点：**

- `SLOAD` 操作是 **100 倍以上 `MLOAD` 的成本**，**尽量减少 `SLOAD` 访问**，使用 `memory` 变量缓存。

---

## **2. 计算优化**

计算（Arithmetic operations）也是 Gas 费用的来源，优化数学运算可以减少 Gas 费用。

### **2.1 低成本的数据类型**

```solidity
// ❌ 差的做法：uint256 计算开销更大
uint256 a = 1;
uint256 b = 2;
uint256 c = a + b;

// ✅ 优化后：使用 uint8 处理小范围数字
uint8 a = 1;
uint8 b = 2;
uint8 c = a + b;
```

✅ **优化点：**

- `uint256` 计算成本高，**尽可能使用 `uint8`、`uint16` 等小数据类型**。

---

### **2.2 使用 `unchecked` 避免溢出检查**

Solidity 0.8+ 版本默认开启溢出检查（SafeMath），可以手动关闭 `unchecked` 以减少 Gas 消耗。

```solidity
// ❌ 差的做法：默认 SafeMath 溢出检查
function bad(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
}

// ✅ 优化后：使用 unchecked 关闭溢出检查
function good(uint256 a, uint256 b) public pure returns (uint256) {
    unchecked {
        return a + b;
    }
}
```

✅ **优化点：**

- **在确保安全的情况下，使用 `unchecked` 关闭溢出检查**，减少 Gas。

---

## **3. 代码优化**

### **3.1 使用 `external` 代替 `public`**

```solidity
// ❌ 差的做法：public 方式消耗更高 Gas
function publicFunction(uint256 x) public returns (uint256) {
    return x + 1;
}

// ✅ 优化后：使用 external
function externalFunction(uint256 x) external returns (uint256) {
    return x + 1;
}
```

✅ **优化点：**

- **`external` 比 `public` 便宜**，因为 `public` 需要 `ABI` 解码参数。

---

### **3.2 事件日志优化**

事件（Event）存储在 **日志（logs）** 中，比 `storage` 便宜，但仍然会消耗 Gas，尽量减少存储的变量。

```solidity
// ❌ 差的做法：存储完整数据
event Transfer(address indexed from, address indexed to, uint256 amount, string message);

// ✅ 优化后：减少非 `indexed` 变量
event Transfer(address indexed from, address indexed to, uint256 amount);
```

✅ **优化点：**

- **使用 `indexed` 关键字**，最多 **3 个 `indexed` 参数**，降低查询成本。

---

## **4. 函数优化**

### **4.1 避免循环中的高成本操作**

```solidity
// ❌ 差的做法：循环内 `SLOAD`
function bad(uint256[] storage arr) public {
    for (uint256 i = 0; i < arr.length; i++) {
        arr[i] = arr[i] + 1;  // `SLOAD` + `SSTORE`
    }
}

// ✅ 优化后：使用 `memory`
function good(uint256[] memory arr) public pure returns (uint256[] memory) {
    for (uint256 i = 0; i < arr.length; i++) {
        arr[i] = arr[i] + 1;  // 只操作 `memory`
    }
    return arr;
}
```

✅ **优化点：**

- **循环内部尽量避免 `SLOAD` 和 `SSTORE`，使用 `memory` 变量缓存**。

---

## **5. 避免 Gas 陷阱**

### **5.1 减少 `msg.sender` 访问**

```solidity
// ❌ 差的做法：多次读取 `msg.sender`
function bad() public {
    address user = msg.sender;
    process(user);
    update(user);
}

// ✅ 优化后：缓存 `msg.sender`
function good() public {
    address user = msg.sender;
    process(user);
    update(user);
}
```

✅ **优化点：**

- **避免重复访问 `msg.sender`，缓存到 `memory` 变量**。

---

## **总结**

| 优化策略     | 关键点                                              |
| ------------ | --------------------------------------------------- |
| **存储优化** | 使用 `memory` 和 `calldata`，减少 `SLOAD`，变量打包 |
| **计算优化** | 使用 `uint8`，`unchecked` 关闭溢出检查              |
| **代码优化** | `external` 代替 `public`，减少 `event` 变量         |
| **函数优化** | 避免循环中的 `SSTORE`，减少 `msg.sender` 访问       |

通过这些优化策略，可以**大幅降低 Solidity 智能合约的 Gas 费用**，提高执行效率！
