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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || "";

    if (!apiKey || apiKey === "undefined") {
      console.warn("Gemini API Key 未設定，請檢查 .env 檔案。");
      return "尚未設定 API Key，請檢查環境變數。";
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 使用最新款的 gemini-2.5-flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPTS.TOOL_DESCRIPTION_GENERATOR,
    });

    const prompt = `請為名為「${name}」的${category}工具生成說明。`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return text || "暫時無法生成說明。";

  } catch (error: any) {
    console.error("Gemini API 錯誤:", error);

    if (error.status === 404 || error.message?.includes("not found")) {
      return "模型連線失敗 (404)。請確認 API Key 權限或模型名稱是否正確。";
    }

    return "由於連線異常，無法自動生成說明。";
  }
};