import { useState, useEffect, useCallback } from "react";
import { Smartphone, User, Lock, ShieldCheck } from "lucide-react";
import type { RegisteredDevice } from "./DeviceRegistration";

interface DeviceChargingProps {
  devices: RegisteredDevice[];
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export default function DeviceCharging({
  devices,
  isAdmin,
  setIsAdmin,
}: DeviceChargingProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(
    null,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAdminLogin = () => {
    if (password === "12345") {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setPassword("");
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  const getRemainingTime = useCallback(
    (device: RegisteredDevice) => {
      const startTime = new Date(device.registeredAt).getTime();
      const durationHours = 5; // Fixed 5 hours as requested
      const endTime = startTime + durationHours * 60 * 60 * 1000;
      const remaining = endTime - currentTime.getTime();

      if (remaining <= 0) return 0;
      return remaining;
    },
    [currentTime],
  );

  const formatTimeShort = (ms: number) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Device Charging</h2>
        </div>
        <div className="text-center py-12">
          <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No devices registered yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Register a device to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Device Charging</h2>
        <button
          onClick={() =>
            isAdmin ? setIsAdmin(false) : setShowPasswordModal(true)
          }
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isAdmin
              ? "bg-emerald-50 text-blue-500 border border-emerald-200"
              : "bg-gray-100 text-blue-500 hover:bg-gray-200"
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {isAdmin ? "Admin View Active" : "View as Admin"}
        </button>
      </div>

      <div
        className={`grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 place-items-center ${!isAdmin ? "lg:grid-cols-12 " : "grid-cols-4"}`}
      >
        {devices.map((device) => {
          const remaining = getRemainingTime(device);
          const isCompleted = remaining === 0;

          return (
            <div
              key={device.id}
              className={`border border-gray-200 rounded-md bg-gradient-to-br from-gray-50 to-white flex items-center justify-center w-fit transition-all relative ${
                !isAdmin
                  ? "bg-white  border-blue-500 p-2 shadow-sm w-fit rounded-full"
                  : isCompleted
                    ? "bg-green-50 border-green-600 shadow-lg p-4 text-blue-500"
                    : "border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4"
              }`}
            >
              {/* Requested Styling: Maintain styles from L86-87 */}
              <div className="z-40 -top-2 border bg-white p-1 -left-3 absolute text-[10px] font-bold text-black shadow-sm min-w-[40px] text-center">
                {isCompleted ? "0:00" : formatTimeShort(remaining)}
              </div>

              {!isAdmin ? (
                <span className="text-sm font-black text-blue-600 drop-shadow-sm">
                  {device.slotNumber}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDevice(device)}
                  className="w-full h-full flex flex-col items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Slot
                  </div>
                  <div
                    className={`text-3xl font-black ${isCompleted ? "text-green-700" : "text-blue-600"}`}
                  >
                    {device.slotNumber}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Device Details
                </div>
                <div className="text-xl font-black text-gray-900">
                  {selectedDevice.deviceName}
                </div>
                <div className="text-sm font-bold text-blue-600">
                  {selectedDevice.deviceType}
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>

            <div className="flex items-start gap-4">
              {selectedDevice.photoUrl ? (
                <img
                  src={selectedDevice.photoUrl}
                  alt={selectedDevice.deviceName}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-10 h-10 text-blue-500" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Slot
                    </div>
                    <div className="text-lg font-black text-gray-900">
                      {selectedDevice.slotNumber}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Price
                    </div>
                    <div className="text-lg font-black text-gray-900">
                      ₦{selectedDevice.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="font-bold text-gray-900 truncate">
                      {selectedDevice.username}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
                      {selectedDevice.registrationMethod === "qr"
                        ? "QR"
                        : "FINGERPRINT"}
                    </span>
                    <span className="text-[10px] font-black bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-100">
                      Reg ID: {selectedDevice.registrationId}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                        selectedDevice.paymentStatus === "PAID"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {selectedDevice.paymentStatus}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono font-black text-gray-600 break-all">
                    {selectedDevice.qrData ||
                      selectedDevice.fingerprintId ||
                      selectedDevice.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Admin Authentication
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter password to view full device details
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  placeholder="Enter admin password"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-lg tracking-widest"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 font-medium">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  Unlock
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
