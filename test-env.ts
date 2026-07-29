import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

async function testEnv() {
  console.log("=== Testing Environment Variables ===");
  
  let allGood = true;

  // 1. Test Supabase
  try {
    console.log("\nTesting Supabase...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project")) {
      throw new Error("Missing or placeholder Supabase credentials.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    // simple query to see if we can reach the DB
    const { error } = await supabase.from('items').select('id').limit(1);
    if (error && error.code !== "42P01") { // 42P01 is table undefined, which just means schema isn't run, but auth is fine
      throw new Error(error.message);
    }
    console.log("✅ Supabase connection successful!");
  } catch (err: any) {
    console.error("❌ Supabase failed:", err.message);
    allGood = false;
  }

  // 2. Test Groq
  try {
    console.log("\nTesting Groq AI...");
    const groqKey = process.env.GROQ_API_KEY;
    
    if (!groqKey || groqKey.includes("gsk_...")) {
      throw new Error("Missing or placeholder Groq API key.");
    }

    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Hello' and nothing else." }],
      model: "llama-3.1-8b-instant",
      max_tokens: 5,
    });
    
    if (completion.choices[0].message.content) {
      console.log("✅ Groq AI connection successful!");
    } else {
      throw new Error("Empty response from Groq.");
    }
  } catch (err: any) {
    console.error("❌ Groq AI failed:", err.message);
    allGood = false;
  }

  // 3. Test Firebase Admin Parse (Just parsing the JSON)
  try {
    console.log("\nTesting Firebase Admin JSON...");
    const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson || serviceAccountJson.includes("...")) {
      throw new Error("Missing or placeholder Firebase Admin JSON.");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.project_id || !serviceAccount.private_key) {
       throw new Error("Invalid Firebase Admin JSON structure.");
    }
    console.log("✅ Firebase Admin JSON parsed successfully!");
  } catch (err: any) {
    console.error("❌ Firebase Admin JSON failed:", err.message);
    allGood = false;
  }

  console.log("\n====================================");
  if (allGood) {
    console.log("🎉 ALL TESTS PASSED! Your .env.local is ready.");
  } else {
    console.log("⚠️ SOME TESTS FAILED. Please check your .env.local file.");
  }
}

testEnv();
