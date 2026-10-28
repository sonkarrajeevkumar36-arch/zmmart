# Zypsomart - Razorpay Live Payment Gateway Setup Guide 💳

यह गाइड आपको Zypsomart प्रोजेक्ट में **Razorpay Live Payments** को सुरक्षित और सही तरीके से सेटअप करने के लिए तैयार की गई है।

---

## 🔒 सुरक्षा का सबसे महत्वपूर्ण नियम (Security Rule)
- **`RAZORPAY_KEY_SECRET` को कभी भी फ्रंटएंड कोड, `src/`, या पब्लिक फ़ाइलों में न डालें।**
- आपका सीक्रेट केवल **Cloudflare Pages Environment Variables (Encrypted Secrets)** में रहेगा।
- फ्रंटएंड को सिर्फ आपका पब्लिक `RAZORPAY_KEY_ID` (जैसे `rzp_live_...`) सर्वर के सुरक्षित एंडपॉइंट के ज़रिए मिलता है।

---

## 1. Razorpay Dashboard से Live Keys प्राप्त करना

1. [Razorpay Dashboard](https://dashboard.razorpay.com/) पर लॉगिन करें।
2. ऊपर बाएं/दाएं कोने में यदि **Test Mode** सक्रिय है, तो स्विच करके **Live Mode** पर जाएं (इसके लिए आपका Razorpay KYC सक्रिय होना चाहिए)।
3. **Settings** (⚙️) ➔ **API Keys** टैब पर जाएं।
4. **Generate Key** (या **Regenerate Key**) बटन पर क्लिक करें।
5. आपको दो कुंजियां दिखाई देंगी:
   - **Key ID:** (उदा: `rzp_live_xxxxxxxxxxxxxxxx`)
   - **Key Secret:** (उदा: `abcdef1234567890abcdef12`)
6. इन दोनों को सुरक्षित रूप से कॉपी कर लें (Key Secret दोबारा नहीं दिखाया जाता)।

---

## 2. Cloudflare Pages में Live Secrets कैसे जोड़ें

चूंकि आपका प्रोजेक्ट Cloudflare Pages पर होस्टेड है, इसलिए API Keys को Cloudflare के सिक्योर एनवायरनमेंट में जोड़ा जाता है:

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) पर लॉगिन करें।
2. **Workers & Pages** ➔ **Pages** पर जाएं।
3. अपने प्रोजेक्ट **Zypsomart** पर क्लिक करें।
4. **Settings** टैब ➔ **Environment variables** पर क्लिक करें।
5. **Add variables** पर क्लिक करें:
   - **Variable name:** `RAZORPAY_KEY_ID`
   - **Value:** आपका Live Key ID (उदा: `rzp_live_xxxxxxxxxxxxxxxx`)
   - **Type / Encrypt:** सामान्य या Encrypted रख सकते हैं।
6. **Add variable** (दुबारा क्लिक करें):
   - **Variable name:** `RAZORPAY_KEY_SECRET`
   - **Value:** आपका Live Key Secret (उदा: `abcdef1234567890abcdef12`)
   - **Encrypt:** ⚠️ **इसे अनिवार्य रूप से "Encrypt" (Secret) पर मार्क करें!**
7. (वैकल्पिक - वेबहुक के लिए):
   - **Variable name:** `RAZORPAY_WEBHOOK_SECRET`
   - **Value:** आपका कोई भी सुरक्षित सीक्रेट टोकन
   - **Encrypt:** Encrypted
8. नीचे **Save** बटन पर क्लिक करें।
9. बदलाव लागू करने के लिए **Deployments** टैब में जाकर अपनी नवीनतम डिप्लॉयमेंट को **Retry deployment** या नया डिप्लॉय करें।

---

## 3. लोकल टेस्टिंग (.env) के लिए (Development Only)

लोकल सिस्टम पर टेस्ट करने के लिए अपनी `.env` फ़ाइल में यह जोड़ें (यह फ़ाइल `.gitignore` में होनी चाहिए):

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef12
```

*(नोट: जब तक KYC पूर्ण न हो, आप `rzp_test_...` कुंजियों का उपयोग करके भी वास्तविक कार्ड / UPI सिमुलेशन का परीक्षण कर सकते हैं)*

---

## 4. सिस्टम कैसे काम करता है (Architecture Flow)

1. **ऑर्डर निर्माण (`/api/create-razorpay-order`):**
   - ग्राहक कार्ट में सामान जोड़कर चेकआउट पर क्लिक करता है।
   - कार्ट का कुल मूल्य (Total + Delivery) सर्वर पर जाता है।
   - Cloudflare Function Razorpay के आधिकारिक सर्वर पर वास्तविक INR ऑर्डर बनाता है।
   - ऑर्डर आईडी सुरक्षित रूप से ब्राउज़र को लौटाई जाती है।

2. **ग्राहक भुगतान (Razorpay Checkout Modal):**
   - ग्राहक के सामने Razorpay का आधिकारिक चेकआउट विंडो खुलता है।
   - ग्राहक Google Pay, PhonePe, Paytm, UPI ID, डेबिट/क्रेडिट कार्ड या नेटबैंकिंग से भुगतान करता है।

3. **सिग्नेचर वेरिफिकेशन (`/api/verify-payment`):**
   - भुगतान पूरा होने पर Razorpay ब्राउज़र को `razorpay_payment_id`, `razorpay_order_id`, और `razorpay_signature` देता है।
   - ऐप यह डेटा Cloudflare Backend को भेजता है।
   - बैकएंड `HMAC-SHA256` से पुष्टि करता है कि भुगतान बैंक से सत्यापित है।

4. **Firestore में ऑर्डर सुरक्षित सेव होना:**
   - **केवल और केवल सिग्नेचर वेरिफिकेशन सफल होने पर ही** Firestore में नया ऑर्डर `status: 'placed'` और `paymentStatus: 'paid'` के साथ सेव होता है।
   - यदि ग्राहक पॉपअप बंद कर देता है या भुगतान रद्द होता है, तो Firestore में कोई डुप्लिकेट या फ़र्ज़ी ऑर्डर नहीं बनता।

---

## 5. सपोर्ट और फ़ॉलबैक (COD)
- यदि कभी भी इंटरनेट या गेटवे में समस्या आती है, तो ग्राहक को तुरंत **Cash on Delivery (COD)** का विकल्प मिलता है ताकि कोई भी बिक्री छूटे नहीं।
