import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractPdfTextWithOCR(pdfBase64: string, fileName?: string) {
  const ocrApiKey = process.env.OCR_SPACE_API_KEY;
  
  console.log("Checking OCR API key:", ocrApiKey ? "Present" : "MISSING");
  
  if (!ocrApiKey) {
    return "[OCR not configured]";
  }

  try {
    console.log("Sending PDF to OCR API...");
    
    const body = new URLSearchParams();
    body.append("base64Image", `data:application/pdf;base64,${pdfBase64}`);
    body.append("language", "eng");
    body.append("isOverlayRequired", "false");
    body.append("OCREngine", "2");
    
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": ocrApiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("OCR response status:", response.status);
    
    const text = await response.text();
    console.log("OCR raw response:", text.substring(0, 200));

    if (!response.ok) {
      return "[OCR service error]";
    }

    const result = JSON.parse(text);
    
    if (result.IsErroredOnProcessing) {
      console.error("OCR error:", result.ErrorMessage);
      return "[OCR failed]";
    }

    const extractedText = result.ParsedResults?.[0]?.ParsedText || "";
    
    if (extractedText.trim().length > 0) {
      console.log("OCR success:", extractedText.length, "characters");
      return extractedText;
    }
    
    return "[No text found]";
    
  } catch (err) {
    console.error("OCR error:", err);
    return "[OCR failed]";
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const question = body?.question;
    const context = body?.context;
    const pdfBase64 = body?.pdfBase64;
    const pdfName = body?.pdfName;
    const previousMessages = body?.messages || [];

    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    let pdfText = "";
    if (pdfBase64) {
      console.log("Processing PDF:", pdfName);
      pdfText = await extractPdfTextWithOCR(pdfBase64, pdfName);
    }

    let fullContext = "";
    
    if (context && context.trim()) {
      fullContext += `Notes:\n${context}\n`;
    }
    
    if (pdfText && pdfText.trim()) {
      fullContext += `\nPDF (${pdfName}):\n${pdfText}`;
    }

    if (!fullContext.trim()) {
      fullContext = "No context provided.";
    }

    const messages: any[] = [
      {
        role: "system",
        content: "You are a helpful study tutor.",
      },
    ];

    if (previousMessages.length > 1) {
      messages.push(...previousMessages.slice(0, -1));
    }

    messages.push({
      role: "user",
      content: `Context:\n${fullContext}\n\nQuestion: ${question}`,
    });

    console.log("Sending to OpenAI...");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages,
      max_tokens: 2000,
    });

    const answer = completion.choices?.[0]?.message?.content ?? "No answer returned.";
    
    console.log("Response received");

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      {
        error: "Tutor failed",
        detail: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}