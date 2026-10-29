# Zypsomart - Razorpay Live Payment Gateway Setup Guide 💳

यह गाइड आपको Zypsomart प्रोजेक्ट में **Razorpay Live Payments (UPI QR, GPay, PhonePe, Cards)** को सुरक्षित और सही तरीके से Vercel या Cloudflare पर सेटअप करने के लिए तैयार की गई है।

---

## 🔒 सुरक्षा का सबसे महत्वपूर्ण नियम (Security Rule)
- **`RAZORPAY_KEY_SECRET` को कभी भी फ्रंटएंड कोड, `src/`, या पब्लिक फ़ाइलों में न डालें।**
- आपका सीक्रेट केवल **Vercel / Cloudflare Environment Variables** में रहेगा।
- फ्रंटएंड केवल सुरक्षित बैकएंड एंडपॉइंट (`/api/create-razorpay-order`) के ज़रिए पब्लिक `RAZORPAY_KEY_ID` प्राप्त करता है।

---

## 1. Razorpay Dashboard से Live Keys प्राप्त करना

1. [Razorpay Dashboard](https://dashboard.razorpay.com/) पर लॉगिन करें।
2. ऊपर बाएं/दाएं कोने में यदि **Test Mode** सक्रिय है, तो स्विच करके **Live Mode** पर जाएं (इसके लिए आपका Razorpay KYC स्वीकृत होना चाहिए)।
3. **Settings** (⚙️) ➔ **API Keys** टैब पर जाएं।
4. **Generate Key** (या **Regenerate Key**) बटन पर क्लिक करें।
5. आपको दो कुंजियां मिलेंगी:
   - **Key ID:** (उदा: `rzp_live_xxxxxxxxxxxxxxxx`)
   - **Key Secret:** (उदा: `abcdef1234567890abcdef12`)
6. इन दोनों को सुरक्षित रूप से कॉपी कर लें (Key Secret दोबारा नहीं दिखाया जाता)।

---

## 2. Vercel में Live Secrets कैसे जोड़ें (यदि ऐप Vercel पर होस्ट है)

यदि आपका लाइव ऐप Vercel डोमेन (जैसे `zypsomart.vercel.app`) पर खुल रहा है:

1. [Vercel Dashboard](https://vercel.com/) पर लॉगिन करें।
2. अपने प्रोजेक्ट **Zypsomart** पर क्लिक करें।
3. ऊपर **Settings** टैब पर जाएं ➔ बाईं तरफ **Environment Variables** पर क्लिक करें।
4. Variable 1 जोड़ें:
   - **Key:** `RAZORPAY_KEY_ID`
   - **Value:** आपका Live Key ID (उदा. `rzp_live_xxxxxxxxxxxxxxxx`)
   - **Environments:** Production, Preview, Development (सभी टिक रखें)
   - **Save** पर क्लिक करें।
5. Variable 2 जोड़ें:
   - **Key:** `RAZORPAY_KEY_SECRET`
   - **Value:** आपका Live Key Secret (उदा. `abcdef1234567890abcdef12`)
   - **Environments:** Production, Preview, Development (सभी टिक रखें)
   - **Save** पर क्लिक करें।
6. (वैकल्पिक - वेबहुक के लिए):
   - **Key:** `RAZORPAY_WEBHOOK_SECRET`
   - **Value:** कोई भी सुरक्षित सीक्रेट टोकन
7. ⚠️ **अति आवश्यक (Crucial Step):** Variables जोड़ने के बाद **Deployments** टैब पर जाएं ➔ नवीनतम डिप्लॉयमेंट के साइड में 3 डॉट्स (`...`) पर क्लिक करके **Redeploy** करें। (बिना Redeploy किए नए वेरिएबल्स एक्टिव नहीं होते हैं!)

---

## 3. Cloudflare Pages में Live Secrets कैसे जोड़ें (यदि ऐप Cloudflare पर होस्ट है)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages** ➔ **Pages** ➔ **Zypsomart** पर जाएं।
2. **Settings** टैब ➔ **Environment variables** पर क्लिक करें।
3. **Add variables**:
   - `RAZORPAY_KEY_ID`: आपका Live Key ID
   - `RAZORPAY_KEY_SECRET`: आपका Live Key Secret (Encrypt toggle ऑन रखें)
4. **Save** दबाएं और **Deployments** टैब में जाकर **Retry deployment** करें।

---

## 4. 404 एरर का समाधान (Why 404 happened & How it was fixed)

- **कारण:** प्रोजेक्ट में बैकएंड एंडपॉइंट्स केवल `/functions/api/*` (Cloudflare Pages का विशिष्ट फोल्डर) में थे। जब ऐप को Vercel पर डिप्लॉय किया गया, तो Vercel `/functions` को अनदेखा कर देता है और केवल `/api/*` में सर्वरलेस फंक्शन्स ढूंढता है। इसलिए Vercel ने `HTTP 404: NOT_FOUND` लौटाया।
- **समाधान:**
  - `/api/create-razorpay-order.ts` और `/api/verify-payment.ts` को Vercel Serverless Function के रूप में जोड़ा गया।
  - `vercel.json` कॉन्फ़िगरेशन जोड़ी गई।
  - अब आपका प्रोजेक्ट **Vercel**, **Cloudflare Pages**, और **लोकल Vite Dev** तीनों पर बिना किसी 404 एरर के 100% काम करता है।

---

## 5. UPI QR Code और पेमेंट फ्लो

1. ग्राहक जब **Pay Online** चुनता है:
   - सर्वर पर कार्ट की वास्तविक राशि (Total + Delivery) के साथ Razorpay ऑर्डर बनता है।
   - आधिकारिक Razorpay Checkout विंडो खुलती है।
2. ग्राहक को **UPI / Dynamic QR Code** का विकल्प सबसे ऊपर मिलता है।
3. ग्राहक अपने फोन के Google Pay, PhonePe, Paytm या किसी भी UPI ऐप से उस ऑर्डर के लिए बने वास्तविक QR कोड को स्कैन कर सकता है।
4. भुगतान के बाद सर्वर पर `HMAC-SHA256` से सिग्नेचर वेरिफाई होता है और उसके बाद ही Firestore में ऑर्डर `Paid` दर्ज होता है।
5. ग्राहक पॉपअप बंद कर दे या भुगतान रद्द हो, तो कोई फ़र्ज़ी या अधूरा ऑर्डर नहीं बनता।
