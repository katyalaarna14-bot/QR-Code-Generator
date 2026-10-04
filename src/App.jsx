import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import "./App.css";

function App() {
  const [type, setType] = useState("url");

  const [url, setUrl] = useState("https://example.com");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");

  const [size, setSize] = useState(300);
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [margin, setMargin] = useState(4);

  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [recentQRs, setRecentQRs] = useState(() => {
    const saved = localStorage.getItem("qrStudioHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const canvasRef = useRef(null);

  const presets = {
    clean: {
      foreground: "#111111",
      background: "#ffffff",
      size: 300,
      margin: 4,
      errorCorrection: "M",
    },

    midnight: {
      foreground: "#f5f5f5",
      background: "#171717",
      size: 300,
      margin: 5,
      errorCorrection: "H",
    },

    soft: {
      foreground: "#5b5147",
      background: "#f4eee5",
      size: 300,
      margin: 5,
      errorCorrection: "Q",
    },
  };

  function getQRValue() {
    if (type === "url") {
      if (!url.trim()) {
        return "";
      }

      try {
        const checkedUrl = new URL(url);

        if (!["http:", "https:"].includes(checkedUrl.protocol)) {
          return "";
        }

        return url;
      } catch {
        return "";
      }
    }

    if (type === "text") {
      return text.trim();
    }

    if (type === "email") {
      if (!email.trim()) {
        return "";
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "";
      }

      return `mailto:${email}`;
    }

    if (type === "phone") {
      if (!phone.trim()) {
        return "";
      }

      if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
        return "";
      }

      return `tel:${phone}`;
    }

    if (type === "wifi") {
      if (!wifiName.trim()) {
        return "";
      }

      return `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`;
    }

    return "";
  }

  function validateInput() {
    if (type === "url") {
      if (!url.trim()) {
        return "Please enter a website URL.";
      }

      try {
        const checkedUrl = new URL(url);

        if (!["http:", "https:"].includes(checkedUrl.protocol)) {
          return "Please enter a valid URL starting with http:// or https://.";
        }
      } catch {
        return "Please enter a valid website URL.";
      }
    }

    if (type === "text") {
      if (!text.trim()) {
        return "Please enter some text.";
      }
    }

    if (type === "email") {
      if (!email.trim()) {
        return "Please enter an email address.";
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address.";
      }
    }

    if (type === "phone") {
      if (!phone.trim()) {
        return "Please enter a phone number.";
      }

      if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
        return "Please enter a valid phone number.";
      }
    }

    if (type === "wifi") {
      if (!wifiName.trim()) {
        return "Please enter your Wi-Fi name.";
      }
    }

    return "";
  }

  useEffect(() => {
    generateQR();
  }, [
    type,
    url,
    text,
    email,
    phone,
    wifiName,
    wifiPassword,
    wifiSecurity,
    size,
    foreground,
    background,
    errorCorrection,
    margin,
  ]);

  async function generateQR() {
    const validationError = validateInput();

    setError(validationError);

    if (!canvasRef.current || validationError) {
      return;
    }

    const qrValue = getQRValue();

    if (!qrValue) {
      return;
    }

    try {
      await QRCode.toCanvas(canvasRef.current, qrValue, {
        width: size,
        margin: margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: foreground,
          light: background,
        },
      });
    } catch (generationError) {
      console.error("QR generation failed:", generationError);
    }
  }

  function handleTypeChange(newType) {
    setType(newType);
    setError("");
  }

  function applyPreset(presetName) {
    const preset = presets[presetName];

    setForeground(preset.foreground);
    setBackground(preset.background);
    setSize(preset.size);
    setMargin(preset.margin);
    setErrorCorrection(preset.errorCorrection);
  }

  async function copyQR() {
    const validationError = validateInput();

    if (validationError) {
      setError(validationError);
      return;
    }

    const qrValue = getQRValue();

    if (!qrValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrValue);
      alert("QR content copied to clipboard!");
    } catch (copyError) {
      console.error("Copy failed:", copyError);
      alert("Could not copy to clipboard.");
    }
  }

  async function downloadSVG() {
    const validationError = validateInput();

    if (validationError) {
      setError(validationError);
      return;
    }

    const qrValue = getQRValue();

    if (!qrValue) {
      return;
    }

    try {
      const svg = await QRCode.toString(qrValue, {
        type: "svg",
        width: size,
        margin: margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: foreground,
          light: background,
        },
      });

      const blob = new Blob([svg], {
        type: "image/svg+xml",
      });

      const link = document.createElement("a");

      link.download = "qr-studio-code.svg";
      link.href = URL.createObjectURL(blob);

      link.click();

      URL.revokeObjectURL(link.href);
    } catch (svgError) {
      console.error("SVG generation failed:", svgError);
    }
  }

  function downloadQR() {
    const validationError = validateInput();

    if (validationError) {
      setError(validationError);
      return;
    }

    const qrValue = getQRValue();

    if (!canvasRef.current || !qrValue) {
      return;
    }

    const link = document.createElement("a");

    link.download = "qr-studio-code.png";
    link.href = canvasRef.current.toDataURL("image/png");

    link.click();

    const newQR = {
      id: Date.now(),
      type: type,
      value: qrValue,
      foreground: foreground,
      background: background,
      size: size,
      margin: margin,
      errorCorrection: errorCorrection,
      wifiName: wifiName,
      wifiPassword: wifiPassword,
      wifiSecurity: wifiSecurity,
    };

    const updatedHistory = [
      newQR,
      ...recentQRs.filter((item) => item.value !== qrValue),
    ].slice(0, 5);

    setRecentQRs(updatedHistory);

    localStorage.setItem(
      "qrStudioHistory",
      JSON.stringify(updatedHistory)
    );
  }

  function reuseQR(qr) {
    setForeground(qr.foreground);
    setBackground(qr.background);
    setSize(qr.size);
    setMargin(qr.margin);
    setErrorCorrection(qr.errorCorrection);

    if (qr.type === "url") {
      setType("url");
      setUrl(qr.value);
    }

    if (qr.type === "text") {
      setType("text");
      setText(qr.value);
    }

    if (qr.type === "email") {
      setType("email");
      setEmail(qr.value.replace("mailto:", ""));
    }

    if (qr.type === "phone") {
      setType("phone");
      setPhone(qr.value.replace("tel:", ""));
    }

    if (qr.type === "wifi") {
      setType("wifi");
      setWifiName(qr.wifiName || "");
      setWifiPassword(qr.wifiPassword || "");
      setWifiSecurity(qr.wifiSecurity || "WPA");
    }

    setError("");
  }

  function getScanWarning() {
    const warnings = [];

    if (
      foreground.toLowerCase() === background.toLowerCase()
    ) {
      warnings.push(
        "Your foreground and background colors are identical."
      );
    }

    if (margin < 2) {
      warnings.push(
        "Very small margins can make QR codes harder to scan."
      );
    }

    if (size < 180) {
      warnings.push(
        "A small QR size may be difficult to scan from a distance."
      );
    }

    if (
      foreground.toLowerCase() === "#ffffff" &&
      background.toLowerCase() === "#000000"
    ) {
      warnings.push(
        "Try keeping the QR's dark modules darker than its background for easier scanning."
      );
    }

    if (errorCorrection === "L") {
      warnings.push(
        "Low error correction provides less protection if the QR gets damaged."
      );
    }

    return warnings;
  }

  const scanWarnings = getScanWarning();

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <header className="header">
        <div>
          <h1>QR Studio</h1>

          <p>
            Turn simple information into a QR code that feels like yours.
          </p>

          <button
            className="theme-button"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      <main className="container">
        <section className="panel">
          <h2>Create QR Code</h2>

          <label>What are you sharing?</label>

          <div className="type-buttons">
            <button
              className={type === "url" ? "active" : ""}
              onClick={() => handleTypeChange("url")}
            >
              URL
            </button>

            <button
              className={type === "text" ? "active" : ""}
              onClick={() => handleTypeChange("text")}
            >
              Text
            </button>

            <button
              className={type === "email" ? "active" : ""}
              onClick={() => handleTypeChange("email")}
            >
              Email
            </button>

            <button
              className={type === "phone" ? "active" : ""}
              onClick={() => handleTypeChange("phone")}
            >
              Phone
            </button>

            <button
              className={type === "wifi" ? "active" : ""}
              onClick={() => handleTypeChange("wifi")}
            >
              Wi-Fi
            </button>
          </div>

          {type === "url" && (
            <>
              <label>Website URL</label>

              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </>
          )}

          {type === "text" && (
            <>
              <label>Your Text</label>

              <textarea
                placeholder="Write anything you want to share..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="5"
              />
            </>
          )}

          {type === "email" && (
            <>
              <label>Email Address</label>

              <input
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {type === "phone" && (
            <>
              <label>Phone Number</label>

              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {type === "wifi" && (
            <>
              <label>Wi-Fi Name</label>

              <input
                type="text"
                placeholder="My Wi-Fi"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
              />

              <label>Wi-Fi Password</label>

              <input
                type="text"
                placeholder="Enter Wi-Fi password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
              />

              <label>Security</label>

              <select
                value={wifiSecurity}
                onChange={(e) => setWifiSecurity(e.target.value)}
              >
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <h2>Make It Yours</h2>

          <label>Quick Presets</label>

          <div className="preset-buttons">
            <button onClick={() => applyPreset("clean")}>
              Clean
            </button>

            <button onClick={() => applyPreset("midnight")}>
              Midnight
            </button>

            <button onClick={() => applyPreset("soft")}>
              Soft Note
            </button>
          </div>

          <label>
            Size: {size}px
          </label>

          <input
            type="range"
            min="150"
            max="500"
            value={size}
            onChange={(e) =>
              setSize(Number(e.target.value))
            }
          />

          <label>Foreground</label>

          <input
            className="color-input"
            type="color"
            value={foreground}
            onChange={(e) =>
              setForeground(e.target.value)
            }
          />

          <label>Background</label>

          <input
            className="color-input"
            type="color"
            value={background}
            onChange={(e) =>
              setBackground(e.target.value)
            }
          />

          <label>Error Correction</label>

          <select
            value={errorCorrection}
            onChange={(e) =>
              setErrorCorrection(e.target.value)
            }
          >
            <option value="L">Low - 7%</option>
            <option value="M">Medium - 15%</option>
            <option value="Q">Quartile - 25%</option>
            <option value="H">High - 30%</option>
          </select>

          <label>
            Margin: {margin}
          </label>

          <input
            type="range"
            min="0"
            max="10"
            value={margin}
            onChange={(e) =>
              setMargin(Number(e.target.value))
            }
          />
        </section>

        <section className="preview-panel">
          <h2>Live Preview</h2>

          <div className="qr-container">
            <canvas ref={canvasRef}></canvas>
          </div>

          {scanWarnings.map((warning, index) => (
            <p
              className="warning-message"
              key={index}
            >
              ⚠ {warning}
            </p>
          ))}

          {!error && scanWarnings.length === 0 && (
            <p className="success-message">
              ✓ Scan-ready
            </p>
          )}

          <div className="action-buttons">
            <button
              className="copy-button"
              onClick={copyQR}
            >
              📋 Copy
            </button>

            <button
              className="download-button"
              onClick={downloadQR}
            >
              Download PNG
            </button>

            <button
              className="svg-button"
              onClick={downloadSVG}
            >
              🖼 Download SVG
            </button>
          </div>

          {recentQRs.length > 0 && (
            <div className="recent-section">
              <h3>Recently Created</h3>

              {recentQRs.map((qr) => (
                <button
                  className="recent-item"
                  key={qr.id}
                  onClick={() => reuseQR(qr)}
                >
                  <span>
                    {qr.type.toUpperCase()}
                  </span>

                  <span>
                    Reuse
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>
          QR Studio · Made for everyday sharing
        </span>

        <span>
          Designed & crafted by Aarna
        </span>
      </footer>
    </div>
  );
}

export default App;