module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
    "@vue/prettier",
    "@vue/eslint-config-typescript"
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2020,
    sourceType: "module",
    jsxPragma: "React",
    ecmaFeatures: {
      jsx: true,
      tsx: true
    }
  },
  rules: {
    // JS/TS
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-debugger": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }
    ],
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }
    ],
    // Vue
    "vue/no-v-html": "off",
    "vue/require-default-prop": "off",
    "vue/require-explicit-emits": "off",
    "vue/multi-word-component-names": "off",
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "always",
          normal: "always",
          component: "always"
        },
        svg: "always",
        math: "always"
      }
    ],
    // Prettier
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto"
      }
    ]
  },
  overrides: [
    {
      // Google Apps Script 檔案的特殊配置
      files: ["gas/**/*.js"],
      env: {
        browser: true,
        es6: true,
        node: false
      },
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: "script"
      },
      globals: {
        // Google Apps Script 全域物件
        HtmlService: "readonly",
        ScriptApp: "readonly",
        DriveApp: "readonly",
        SpreadsheetApp: "readonly",
        GmailApp: "readonly",
        CalendarApp: "readonly",
        DocumentApp: "readonly",
        SlidesApp: "readonly",
        FormApp: "readonly",
        PropertiesService: "readonly",
        UrlFetchApp: "readonly",
        Utilities: "readonly",
        Session: "readonly",
        Logger: "readonly",
        // GAS 入口函數
        doGet: "readonly",
        doPost: "readonly",
        onOpen: "readonly",
        onInstall: "readonly",
        onEdit: "readonly"
      },
      rules: {
        // 允許未使用的變數（GAS的入口函數）
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
        // 允許未定義的全域變數（GAS API）
        "no-undef": "off",
        // 關閉 TypeScript 相關規則
        "@typescript-eslint/explicit-module-boundary-types": "off",
        // 關閉 Prettier（GAS 檔案格式可能不同）
        "prettier/prettier": "off"
      }
    }
  ]
}
