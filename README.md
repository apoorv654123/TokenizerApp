# 🧠 Custom Tokenizer App

A simple JavaScript/React custom tokenizer that can **learn new vocabulary dynamically** during encoding, and supports **special tokens**, **encoding**, and **decoding**.  
Built using **React** + **TailwindCSS**.

🔗Website Link: https://customtokenizerapp.netlify.app/

<br>

## ✨ Features
- **Dynamic Vocabulary Learning** — Learns unknown words automatically during encoding.
- **Special Tokens Support** — PAD, UNK, BOS, EOS.
- **Two-Way Conversion** — Encode text to IDs and decode IDs back to text.
- **Error Handling** — Alerts for empty inputs.
- **Built with React + TailwindCSS** for a responsive and minimal UI.

<br>

## 🛠️ Setup

1. **Clone the repository**
    ```bash
   git clone https://github.com/apoorv654123/TokenizerApp.git
   cd custom-tokenizer-demo
    ```

2. **Install dependencies**
   ```bash
   npm install
    ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

<br>

## 🚀 Usage

### 1️⃣ Encode Text

* Type any sentence in the **"Text to Encode"** field.
* Click **Encode**.
* See the generated token IDs.
* If you enter a new word, it will be **learned and added to the vocab** automatically.

### 2️⃣ Decode Token IDs

* Enter IDs separated by spaces or commas in the **"Token IDs to Decode"** field.
* Click **Decode**.
* See the decoded text.

<br>

## 📜 Special Tokens

| Token   | Description                 |
| ------- | --------------------------- |
| `<PAD>` | Padding token               |
| `<UNK>` | Unknown token (fallback)    |
| `<BOS>` | Beginning of sentence token |
| `<EOS>` | End of sentence token       |

<br>

## 📂 File Structure

```
custom-tokenizer-App/
│
├── src/
│   ├── components/       
│   |   ├── Header.jsx           # Header component
│   |   └── Footer.jsx          # Footer component
│   ├── App.jsx           # Main React component
│   ├── index.css         # TailwindCSS styles
│   └── main.jsx          # React entry point
│
├── package.json
└── README.md
```

<br>

## 📸 Screenshots

![Screenshot](/ReadmeAssets/S1.png)
![Screenshot](/ReadmeAssets/S2.png)

<br>

## 🧩 Example

**Encoding:**

```
Input: "Hello world"
Output: [2, 4, 5, 3]
```

> 2 = `<BOS>`, 4 = "Hello", 5 = "world", 3 = `<EOS>`

**Decoding:**

```
Input: 2 4 5 3
Output: "Hello world"
```
