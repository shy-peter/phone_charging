import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Smartphone,
  User,
  Calendar,
  Image,
  QrCode,
  Fingerprint,
  Printer,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  registerFingerprint,
  isFingerprintAvailable,
  type FingerprintRegistration,
} from "../utils/fingerprintScanner";

export type RegistrationMethod = "qr" | "fingerprint";
export type DeviceType = "Phone" | "Power Bank" | "E-Scooter" | "E-Bike" | "EV" | "PC";
export type PaymentStatus = "PAID" | "PAY LATER";

export const DEVICE_PRICES: Record<DeviceType, number> = {
  Phone: 200,
  "Power Bank": 300,
  "E-Scooter": 700,
  "E-Bike": 1000,
  EV: 10000,
  PC: 1000,
};

export const CHARGING_DURATIONS: Record<DeviceType, number> = {
  Phone: 5,
  PC: 5,
  "Power Bank": 8,
  "E-Scooter": 10,
  "E-Bike": 12,
  EV: 24,
};

export interface RegisteredDevice {
  id: string;
  registrationId: string;
  username: string;
  deviceName: string;
  deviceType: DeviceType;
  price: number;
  pickupDate: string;
  photoUrl: string | null;
  registeredAt: Date;
  registeredAtTime: string;
  retrievedAt?: Date;
  retrievedAtTime?: string;
  registeredBy?: string;
  releasedBy?: string;
  releaseAuthMethod?: 'pin' | 'biometric' | 'fingerprint' | 'manual';
  retrievalPin?: string;
  registrationMethod: RegistrationMethod;
  status: "charging" | "completed";
  paymentStatus: PaymentStatus;
  slotNumber: number;
  qrData?: string;
  fingerprintId?: string;
  fingerprintData?: FingerprintRegistration;
}

interface DeviceRegistrationProps {
  onRegister: (device: RegisteredDevice) => void;
  occupiedSlots: number[];
  defaultRegisteredBy?: string;
  lockRegisteredBy?: boolean;
}

export default function DeviceRegistration({
  onRegister,
  occupiedSlots,
  defaultRegisteredBy,
  lockRegisteredBy,
}: DeviceRegistrationProps) {
  const [step, setStep] = useState<
    "form" | "method-selection" | "processing-fingerprint" | "success-qr" | "fingerprint-error"
  >("form");
  const [username, setUsername] = useState("");
  const [registeredBy, setRegisteredBy] = useState(defaultRegisteredBy ?? "");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType | "">("");
  const [pickupDate, setPickupDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"now" | "retrieval">(
    "now",
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentDevice, setCurrentDevice] = useState<RegisteredDevice | null>(
    null,
  );
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check fingerprint support on mount
  useEffect(() => {
    const checkFingerprintSupport = async () => {
      const supported = await isFingerprintAvailable();
      setFingerprintSupported(supported);
    };
    checkFingerprintSupport();
  }, []);

  useEffect(() => {
    if (typeof defaultRegisteredBy === "string") {
      setRegisteredBy(defaultRegisteredBy);
    }
  }, [defaultRegisteredBy]);

  const frequentDevices = [
    "iPhone ",
    "Samsung",
    "nokia",
    "acer",
    "hp",
  ];

  const getRandomSlot = () => {
    const totalSlots = 1000;
    const available = Array.from(
      { length: totalSlots },
      (_, i) => i + 1,
    ).filter((slot) => !occupiedSlots.includes(slot));
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitialSubmit = () => {
    if (!registeredBy || !username || !deviceName || !pickupDate || !deviceType) {
      alert("Please fill in all required fields");
      return;
    }
    if (!photoPreview) {
      alert("Device photo is mandatory");
      return;
    }
    setStep("method-selection");
  };

  const registerDevice = async (method: RegistrationMethod) => {
    if (!deviceType) return;
    const slot = getRandomSlot();
    if (slot === -1) {
      alert("No charging slots available!");
      return;
    }

    const deviceId = Date.now().toString();
    const registrationId = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const retrievalPin = String(Math.floor(1000 + Math.random() * 9000));
    const now = new Date();
    const registeredAtTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    if (method === "qr") {
      // QR method - no scanning needed
      const newDevice: RegisteredDevice = {
        id: deviceId,
        registrationId,
        registeredBy,
        username,
        deviceName,
        deviceType: deviceType as DeviceType,
        price: DEVICE_PRICES[deviceType as DeviceType],
        pickupDate,
        photoUrl: photoPreview,
        registeredAt: now,
        registeredAtTime,
        retrievalPin,
        registrationMethod: method,
        status: "charging",
        paymentStatus: paymentMethod === "now" ? "PAID" : "PAY LATER",
        slotNumber: slot,
        qrData: `DEV-${deviceId}-${username.replace(/\s+/g, "")}`,
      };
      setCurrentDevice(newDevice);
      onRegister(newDevice);
      setStep("success-qr");
    } else {
      // Fingerprint method - actual scanning
      setStep("processing-fingerprint");
      setFingerprintError(null);

      try {
        // Call the actual fingerprint scanner
        const fingerprintData = await registerFingerprint(deviceId, username);

        // Create device with fingerprint data
        const newDevice: RegisteredDevice = {
          id: deviceId,
          registrationId,
          registeredBy,
          username,
          deviceName,
          deviceType: deviceType as DeviceType,
          price: DEVICE_PRICES[deviceType as DeviceType],
          pickupDate,
          photoUrl: photoPreview,
          registeredAt: now,
          registeredAtTime,
          retrievalPin,
          registrationMethod: method,
          status: "charging",
          paymentStatus: paymentMethod === "now" ? "PAID" : "PAY LATER",
          slotNumber: slot,
          fingerprintId: fingerprintData.credentialId,
          fingerprintData: fingerprintData,
        };

        setCurrentDevice(newDevice);
        onRegister(newDevice);
        // Instead of alert, show the same success page
        setStep("success-qr"); 
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Fingerprint registration failed";
        
        setFingerprintError(errorMessage);
        setStep("fingerprint-error");
      }
    }
  };

  const resetForm = () => {
    setUsername("");
    setRegisteredBy("");
    setDeviceName("");
    setDeviceType("");
    setPickupDate("");
    setPaymentMethod("now");
    setPhotoPreview(null);
    setStep("form");
    setCurrentDevice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setPickupDate(date.toISOString().split("T")[0]);
  };

  const handlePrint = () => {
    window.print();
  };

  if (step === "success-qr" && currentDevice) {
    return (
      <div className="bg-white rounded-xl relative shadow-sm p-8 text-center max-w-md mx-auto">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body * { visibility: hidden; }
            .print-receipt, .print-receipt * { visibility: visible; }
            .print-receipt { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `,
          }}
        />

        <div className="print:hidden flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 print:hidden">
          Registration Successful!
        </h2>
        <p className="text-gray-600 mb-8 print:hidden">
          Please print this QR code as your receipt.
        </p>

        <div className="bg-emerald-500 text-white p-6 rounded-2xl mb-8 text-center shadow-xl border-4 border-white animate-in zoom-in duration-500">
          <p className="text-xs font-black uppercase tracking-[0.3em] mb-1 opacity-90">Plug Device Into</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-bold opacity-70">SLOT</span>
            <span className="text-7xl font-black tracking-tighter drop-shadow-lg">{currentDevice.slotNumber}</span>
          </div>
          <p className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-80">Reserved for {currentDevice.username}</p>
        </div>

        <div className="print-receipt bg-white p-8 border-2 border-gray-100 rounded-2xl inline-block mb-8 shadow-inner">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">DEVICE RECEIPT</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
              Charging Service
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {currentDevice.registrationMethod === 'qr' ? (
              <QRCode value={currentDevice.qrData || ""} size={180} />
            ) : (
              <div className="bg-emerald-50 p-8 rounded-full border-4 border-emerald-100">
                <Fingerprint size={80} className="text-emerald-500" />
              </div>
            )}
          </div>
            <div className="flex justify-between items-end border-b border-gray-100 pb-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  User
                </p>
                <p className="font-bold text-gray-800">
                  {currentDevice.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Device
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {currentDevice.deviceName}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </p>
                <p
                  className={`text-sm font-black ${currentDevice.paymentStatus === "PAID" ? "text-green-600" : "text-red-600"}`}
                >
                  {currentDevice.paymentStatus}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Price
                </p>
                <p className="text-sm font-bold text-gray-900">
                  ₦{currentDevice.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Retrieval PIN
                </p>
                <p className="text-sm font-black text-gray-900">
                  {currentDevice.retrievalPin}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Agent
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {currentDevice.registeredBy}
                </p>
              </div>
            </div>

            <div className="pt-4 text-center border-t border-dashed border-gray-200">
              <p className="text-[10px] text-gray-400">
                ID: {currentDevice.qrData}
              </p>
              <p className="text-[9px] text-gray-300 mt-1">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
            <button
              onClick={resetForm}
              className="text-gray-500 font-medium hover:text-gray-700"
            >
              Register Another Device
            </button>
          </div>
        </div>
      );
    }

  if (step === "processing-fingerprint") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-md mx-auto">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-blue-50 p-8 rounded-full">
            <Fingerprint className="w-16 h-16 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">
          Scanning Fingerprint
        </h2>
        <p className="text-gray-600">
          Please place your finger on the scanner...
        </p>
        <div className="mt-8 flex justify-center">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "method-selection") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
        <button
          onClick={() => setStep("form")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to details
        </button>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Choose Method</h2>
        <p className="text-gray-600 mb-8">
          Select how you would like to register the device.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => registerDevice("qr")}
            className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Register with QR Code</p>
              <p className="text-sm text-gray-500">
                Generate a printed receipt for retrieval
              </p>
            </div>
          </button>

          <button
            onClick={() => registerDevice("fingerprint")}
            disabled={!fingerprintSupported}
            className={`flex items-center gap-4 p-5 border-2 rounded-xl transition-all text-left group ${
              fingerprintSupported
                ? "border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer"
                : "border-gray-100 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`p-3 rounded-lg transition-colors ${
              fingerprintSupported
                ? "bg-emerald-100 group-hover:bg-emerald-200"
                : "bg-gray-100"
            }`}>
              <Fingerprint className={`w-8 h-8 ${
                fingerprintSupported ? "text-emerald-600" : "text-gray-400"
              }`} />
            </div>
            <div>
              <p className={`font-bold ${
                fingerprintSupported ? "text-gray-800" : "text-gray-500"
              }`}>
                Register with Fingerprint
              </p>
              <p className="text-sm text-gray-500">
                {fingerprintSupported
                  ? "Use biometric data for secure retrieval"
                  : "Fingerprint scanner not available on this device"}
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === "fingerprint-error") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
        <button
          onClick={() => {
            setStep("method-selection");
            setFingerprintError(null);
          }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">
          Fingerprint Error
        </h2>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{fingerprintError}</p>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          Please try one of the following:
        </p>

        <ul className="text-sm text-gray-700 space-y-2 mb-6 ml-4 list-disc">
          <li>Ensure your device has a working fingerprint scanner</li>
          <li>Try placing your finger on the scanner again</li>
          <li>Use a different registration method (QR Code)</li>
        </ul>

        <button
          onClick={() => {
            setStep("method-selection");
            setFingerprintError(null);
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Try Another Method
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">New Registration</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent (Staff Name)
          </label>
          <input
            type="text"
            value={registeredBy}
            onChange={(e) => setRegisteredBy(e.target.value)}
            placeholder="Enter agent name"
            disabled={!!lockRegisteredBy}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
              lockRegisteredBy ? "bg-gray-50 text-gray-600" : ""
            }`}
          />
        </div>

        <div className="flex gap-4">
          {/* user name */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          {/* device name */}

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Device Type
              </div>
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              <option value="">Select device type</option>
              {Object.keys(DEVICE_PRICES).map((type) => (
                <option key={type} value={type}>
                  {type} (₦{DEVICE_PRICES[type as DeviceType].toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          {/* device type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Device Name
              </div>
            </label>
            <div className="relative">
              <div className="my-2.5 flex flex-wrap gap-2">
                {frequentDevices.slice(0, 3).map((name) => (
                  <button
                    key={name}
                    onClick={() => setDeviceName(name)}
                    className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. iPhone 15"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pickup Date
              </div>
            </label>
            <div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setQuickDate(0)}
                  className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setQuickDate(1)}
                  className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
                >
                  Tomorrow
                </button>
              </div>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Option
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod("now")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === "now"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                    : "border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Pay Now
              </button>
              <button
                onClick={() => setPaymentMethod("retrieval")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === "retrieval"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                    : "border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Pay on Retrieval
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Device Photo (Mandatory)
              </div>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                photoPreview
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={photoPreview}
                    alt="Device preview"
                    className="w-24 h-24 object-cover rounded-lg mb-2 shadow-sm"
                  />
                  <p className="text-[10px] text-blue-600 font-medium">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 font-medium">
                    Upload photo
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        <button
          onClick={handleInitialSubmit}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
        >
          Continue to Registration Method
        </button>
      </div>
    </div>
  );
}
