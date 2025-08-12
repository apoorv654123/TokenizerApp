import { useEffect, useRef, useState } from "react";

import Footer from "./components/Footer";
import Header from "./components/Header";

/* Custom Tokenizer: learns from text, reserves special tokens,
   and supports learning new tokens during encode (learnOnEncode = true) */
class Tokenizer {
  constructor(options = {}) {
    const { lowercase = true, specialTokens, learnOnEncode = true } = options;
    this.lowercase = lowercase;
    this.learnOnEncode = !!learnOnEncode;
    this.specialTokens = Object.assign(
      { PAD: "[PAD]", UNK: "[UNK]", BOS: "[BOS]", EOS: "[EOS]" },
      specialTokens || {}
    );
    this.resetVocab();
  }

  resetVocab() {
    this.tokenToId = Object.create(null);
    this.idToToken = Object.create(null);
    this.vocabSize = 0;
    this.specialTokenIds = {};
    for (const key of Object.keys(this.specialTokens)) {
      const tok = this.specialTokens[key];
      this.specialTokenIds[key] = this._addToken(tok);
    }
  }

  _addToken(token) {
    if (this.tokenToId[token] !== undefined) return this.tokenToId[token];
    const id = this.vocabSize++;
    this.tokenToId[token] = id;
    this.idToToken[id] = token;
    return id;
  }

  train(text, opts = {}) {
    const { maxVocab = null, append = false } = opts;
    if (!append) this.resetVocab();
    if (!text) return;
    if (this.lowercase) text = text.toLowerCase();

    // tokenization: words (incl. contractions) OR single non-space non-word char
    const tokens = text.match(/[\w']+|[^\s\w]/g) || [];

    const freq = Object.create(null);
    for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

    const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    const reserved = Object.keys(this.specialTokens).length;
    for (const [token] of entries) {
      if (maxVocab && this.vocabSize - reserved >= maxVocab) break;
      if (this.tokenToId[token] === undefined) this._addToken(token);
    }
  }

  /* encode: if learnOnEncode === true, unknown tokens will be added to vocab */
  encode(text, opts = {}) {
    const { addBOS = false, addEOS = false } = opts;
    if (!text) return [];
    if (this.lowercase) text = text.toLowerCase();
    const tokens = text.match(/[\w']+|[^\s\w]/g) || [];

    const ids = [];
    if (addBOS) ids.push(this.specialTokenIds.BOS);
    for (const t of tokens) {
      if (this.tokenToId[t] !== undefined) {
        ids.push(this.tokenToId[t]);
      } else if (this.learnOnEncode) {
        const newId = this._addToken(t);
        ids.push(newId);
      } else {
        ids.push(this.specialTokenIds.UNK);
      }
    }
    if (addEOS) ids.push(this.specialTokenIds.EOS);
    return ids;
  }

  decode(ids = [], opts = {}) {
    const { skipSpecial = true } = opts;
    const tokens = ids.map((id) =>
      this.idToToken[id] !== undefined
        ? this.idToToken[id]
        : this.specialTokens.UNK
    );
    if (skipSpecial) {
      const specials = new Set(Object.values(this.specialTokens));
      const filtered = tokens.filter((t) => !specials.has(t));
      return filtered.join(" ").replace(/\s([.,!?;:])/g, "$1");
    }
    return tokens.join(" ").replace(/\s([.,!?;:])/g, "$1");
  }

  getVocab() {
    return {
      tokenToId: { ...this.tokenToId },
      idToToken: { ...this.idToToken },
      specialTokenIds: { ...this.specialTokenIds },
    };
  }

  save() {
    return JSON.stringify(this.getVocab());
  }

  load(jsonStr = "") {
    if (!jsonStr) return;
    try {
      const parsed = JSON.parse(jsonStr);
      this.tokenToId = parsed.tokenToId || Object.create(null);
      this.idToToken = parsed.idToToken || Object.create(null);
      this.specialTokenIds = parsed.specialTokenIds || Object.create(null);
      this.vocabSize = Object.keys(this.idToToken).length;
    } catch (e) {
      throw new Error("Invalid JSON for vocab");
    }
  }
}

/* React UI (keeps previous layout & adds requested features) */
export default function TokenizerApp() {
  const tokenizerRef = useRef(null);
  const [trainingText, setTrainingText] = useState(
    "Good morning, a b c d e f g h i j k l m n o p q r s t u v w x y z A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 0 1 2 3 4 5 6 7 8 9 ! # $ % & ' ( ) * + , - . / : ; < = > ? @ [ ] ^ _ ` { | } ~ \" "
  );
  const [maxVocab, setMaxVocab] = useState(200);
  const [appendMode, setAppendMode] = useState(false);
  const [vocab, setVocab] = useState({
    tokenToId: {},
    idToToken: {},
    specialTokenIds: {},
  });

  const [encodeText, setEncodeText] = useState("Hello, tokenizer!");
  const [addBOS, setAddBOS] = useState(false);
  const [addEOS, setAddEOS] = useState(false);
  const [encodedIds, setEncodedIds] = useState([]);
  const [encodedTokens, setEncodedTokens] = useState([]);

  const [decodeInput, setDecodeInput] = useState("0,1,2");
  const [decodedText, setDecodedText] = useState("");

  useEffect(() => {
    tokenizerRef.current = new Tokenizer({
      lowercase: true,
      learnOnEncode: true,
    });
    // initial train so UI starts with some tokens
    tokenizerRef.current.train(trainingText, {
      maxVocab: maxVocab,
      append: false,
    });
    setVocab(tokenizerRef.current.getVocab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTrain() {
    try {
      tokenizerRef.current.train(trainingText, {
        maxVocab: Number(maxVocab) || null,
        append: appendMode,
      });
      setVocab(tokenizerRef.current.getVocab());
      alert("Vocabulary trained/updated.");
    } catch (e) {
      alert("Training failed: " + e.message);
    }
  }

  function handleClearVocab() {
    tokenizerRef.current.resetVocab();
    setVocab(tokenizerRef.current.getVocab());
    alert("Vocab reset.");
  }

  function handleEncode() {
    if (!tokenizerRef.current) {
      alert("Tokenizer not initialized yet.");
      return;
    }
    if (!encodeText || !encodeText.trim()) {
      alert("Please enter text to encode.");
      return;
    }
    const ids = tokenizerRef.current.encode(encodeText, { addBOS, addEOS });
    const tokens = ids.map(
      (id) => tokenizerRef.current.idToToken[id] || "[UNK]"
    );
    setEncodedIds(ids);
    setEncodedTokens(tokens);
    // update vocab in UI because we might've learned new tokens
    setVocab(tokenizerRef.current.getVocab());
  }

  function parseIdsFromString(s) {
    if (!s) return [];
    const matches = s.match(/\d+/g);
    if (!matches) return [];
    return matches.map((n) => Number(n));
  }

  function handleDecode() {
    if (!tokenizerRef.current) {
      alert("Tokenizer not initialized yet.");
      return;
    }
    const ids = parseIdsFromString(decodeInput);
    if (!ids.length) {
      alert(
        "Please enter at least one token ID to decode (numbers like 0,1,2)."
      );
      return;
    }
    try {
      const txt = tokenizerRef.current.decode(ids, { skipSpecial: true });
      setDecodedText(txt);
    } catch (e) {
      alert("Decode failed: " + e.message);
    }
  }

  function handleSaveVocab() {
    const json = tokenizerRef.current.save();
    try {
      navigator.clipboard.writeText(json);
    } catch (e) {
      // ignore clipboard errors ;)
    }
    localStorage.setItem("tokenizer_vocab", json);
    alert(
      "Vocab saved to localStorage (and copied to clipboard if permitted)."
    );
  }

  function handleLoadVocab() {
    const json = localStorage.getItem("tokenizer_vocab");
    if (!json) {
      alert("No vocab found in localStorage under key 'tokenizer_vocab'.");
      return;
    }
    try {
      tokenizerRef.current.load(json);
      setVocab(tokenizerRef.current.getVocab());
      alert("Vocab loaded from localStorage.");
    } catch (e) {
      alert("Failed to load vocab: " + e.message);
    }
  }

  function handleDeleteVocab() {
    const json = localStorage.removeItem("tokenizer_vocab");
    if (!json) {
    alert("No vocab found in localStorage.");
    return;
    }
  }

  // display vocab as array sorted by id
  const vocabList = Object.entries(vocab.idToToken || {})
    .map(([id, token]) => ({ id: Number(id), token }))
    .sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Training & Vocab */}
          <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-medium text-lg mb-2">Train / Vocab</h2>
            <label className="block text-sm text-slate-700 mb-1">
              Training text
            </label>
            <textarea
              className="w-full h-36 p-2 border rounded-md bg-slate-50 text-sm"
              value={trainingText}
              onChange={(e) => setTrainingText(e.target.value)}
            />

            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm">Max vocab (non-special)</label>
              <input
                type="number"
                min="10"
                className="w-24 p-1 border rounded-md"
                value={maxVocab}
                onChange={(e) => setMaxVocab(e.target.value)}
              />
              <label className="inline-flex items-center gap-2 ml-2">
                <input
                  type="checkbox"
                  checked={appendMode}
                  onChange={(e) => setAppendMode(e.target.checked)}
                />
                <span className="text-sm">Append (otherwise reset)</span>
              </label>
              <button
                className="ml-auto px-3 py-1 bg-indigo-600 text-white rounded-md cursor-pointer"
                onClick={handleTrain}
              >
                Learn Vocab
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1 bg-slate-200 rounded-md text-sm cursor-pointer"
                onClick={handleSaveVocab}
              >
                Save Vocab
              </button>
              <button
                className="px-3 py-1 bg-slate-200 rounded-md text-sm cursor-pointer"
                onClick={handleLoadVocab}
              >
                Load Vocab
              </button>
              <button
                className="px-3 py-1 bg-red-400 rounded-md text-sm ml-auto cursor-pointer"
                onClick={handleDeleteVocab}
              >
                Delete Vocab
              </button>
              <button
                className="px-3 py-1 bg-rose-200 rounded-md text-sm ml-auto cursor-pointer"
                onClick={handleClearVocab}
              >
                Reset Vocab
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-600">
                Vocabulary size: <strong>{vocabList.length}</strong> (including
                special tokens)
              </div>
              <div className="mt-2 h-48 overflow-auto border rounded-md p-2 bg-slate-50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="w-20">ID</th>
                      <th>Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vocabList.slice(0, 200).map((row) => (
                      <tr
                        key={row.id}
                        className="odd:bg-white even:bg-slate-100"
                      >
                        <td className="font-mono">{row.id}</td>
                        <td>{row.token}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                (Showing up to first 200 tokens.)
              </div>
            </div>
          </section>

          {/* Right: Encode / Decode */}
          <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-medium text-lg mb-2">Encode / Decode</h2>

            <label className="block text-sm text-slate-700 mb-1">
              Text to encode
            </label>
            <input
              className="w-full p-2 border rounded-md mb-2"
              value={encodeText}
              onChange={(e) => setEncodeText(e.target.value)}
            />
            <div className="flex items-center gap-3 mb-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addBOS}
                  onChange={(e) => setAddBOS(e.target.checked)}
                />
                <span className="text-sm">Add BOS</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addEOS}
                  onChange={(e) => setAddEOS(e.target.checked)}
                />
                <span className="text-sm">Add EOS</span>
              </label>
              <button
                className="ml-auto px-3 py-1 bg-emerald-600 text-white rounded-md cursor-pointer"
                onClick={handleEncode}
              >
                Encode
              </button>
            </div>

            <label className="block text-sm text-slate-700">Encoded IDs</label>
            <pre className="p-2 bg-slate-100 rounded-md max-h-28 overflow-auto text-sm font-mono">
              {JSON.stringify(encodedIds)}
            </pre>

            <label className="block text-sm text-slate-700 mt-3 mb-1">
              Tokens (decoded from those IDs)
            </label>
            <pre className="p-2 bg-slate-100 rounded-md max-h-28 overflow-auto text-sm font-mono">
              {JSON.stringify(encodedTokens)}
            </pre>

            <hr className="my-4" />

            <label className="block text-sm text-slate-700 mb-1">
              IDs to decode (comma/space separated)
            </label>
            <input
              className="w-full p-2 border rounded-md mb-2"
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-md cursor-pointer"
                onClick={handleDecode}
              >
                Decode
              </button>
              <button
                className="px-3 py-1 bg-slate-200 rounded-md cursor-pointer"
                onClick={() => {
                  setDecodeInput(encodedIds.join(","));
                }}
              >
                Use last encoded
              </button>
            </div>

            <label className="block text-sm text-slate-700 mt-3 mb-1">
              Decoded text
            </label>
            <div className="p-2 bg-slate-50 border rounded-md min-h-[44px]">
              {decodedText}
            </div>

            <div className="text-xs text-slate-500 mt-4">
              Special tokens mapping:
            </div>
            <pre className="p-2 bg-slate-100 rounded-md mt-2 font-mono">
              {JSON.stringify(vocab.specialTokenIds, null, 2)}
            </pre>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
}
