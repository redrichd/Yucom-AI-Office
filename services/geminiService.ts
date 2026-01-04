/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
// 引用您在 config/prompts.ts 建立的設定檔
import { SYSTEM_PROMPTS } from '../config/prompts';

/**
 * 悠康 AI 智能優化辦公室 - 工具說明生成服務
 * 修正後的正確套件名稱：@google/generative-ai
 */
export const generateToolDescription = async (name: string, category: string) => {
  try {
    // 1. 初始化 API 客戶端
    // 使用 import.meta.env 讀取鑰匙，紅線應該會消失了
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

    // 2. 初始化模型並注入系統提示詞
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPTS.TOOL_DESCRIPTION_GENERATOR,
    });

    // 3. 準備並發送請求
    const prompt = `請為名為「${name}」的${category}工具生成說明。`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return text || "暫時無法生成說明。";

  } catch (error) {
    console.error("Gemini API 錯誤:", error);
    return "由於連線異常，無法自動生成說明。";
  }
};