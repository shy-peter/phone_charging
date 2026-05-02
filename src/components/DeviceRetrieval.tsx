import { useState, useEffect } from 'react';
import { QrCode, Fingerprint, Search, Smartphone, User, Calendar, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { RegisteredDevice } from './DeviceRegistration';
import { verifyFingerprint, isFingerprintAvailable, type FingerprintRegistration } from '../utils/fingerprintScanner';

interface DeviceRetrievalProps {
  devices: RegisteredDevice[];
  onRetrieve: (device: RegisteredDevice) => void;
  onPaymentUpdate: (deviceId: string) => void;
  defaultAgentName?: string;
  lockAgentName?: boolean;
}

export default function DeviceRetrieval({
  devices,
  onRetrieve,
  onPaymentUpdate,
  defaultAgentName,
  lockAgentName,
}: DeviceRetrievalProps) {
  const [method, setMethod] = useState<'selection' | 'qr' | 'fingerprint'>('selection');
  const [qrInput, setQrInput] = useState('');
  const [retrievedDevice, setRetrievedDevice] = useState<RegisteredDevice | null>(null);
  const [foundBy, setFoundBy] = useState<'qr' | 'fingerprint' | null>(null);
  const [agentName, setAgentName] = useState(defaultAgentName ?? '');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  const [fingerprintScanError, setFingerprintScanError] = useState<string | null>(null);

  // Check fingerprint support on mount
  useEffect(() => {
    const checkFingerprintSupport = async () => {
      const supported = await isFingerprintAvailable();
      setFingerprintSupported(supported);
    };
    checkFingerprintSupport();
  }, []);

  useEffect(() => {
    if (typeof defaultAgentName === 'string') {
      setAgentName(defaultAgentName);
    }
  }, [defaultAgentName]);

  const handleQrSearch = () => {
    setError(null);
    const device = devices.find(d => d.qrData === qrInput || d.id === qrInput);
    if (device) {
      setRetrievedDevice(device);
      setFoundBy('qr');
    } else {
      setError('Invalid QR code or Device ID. Please try again.');
    }
  };

  const handlePaymentConfirm = () => {
    if (retrievedDevice) {
      setIsProcessingPayment(true);
      setTimeout(() => {
        onPaymentUpdate(retrievedDevice.id);
        setRetrievedDevice({ ...retrievedDevice, paymentStatus: 'PAID' });
        setIsProcessingPayment(false);
      }, 1000);
    }
  };

  const handleFingerprintScan = async () => {
    setIsScanning(true);
    setError(null);
    setFingerprintScanError(null);
    
    try {
      // Get all devices registered with fingerprint
      const fingerprintDevices = devices.filter(
        d => d.registrationMethod === 'fingerprint' && d.status === 'charging' && d.fingerprintData
      );

      if (fingerprintDevices.length === 0) {
        setIsScanning(false);
        setFingerprintScanError('No devices registered with fingerprint found.');
        setError('No fingerprint-registered devices available for this user.');
        return;
      }

      // Convert fingerprint data for verification
      const fingerprintCredentials: FingerprintRegistration[] = fingerprintDevices
        .map(d => d.fingerprintData)
        .filter((data): data is FingerprintRegistration => data !== undefined);

      if (fingerprintCredentials.length === 0) {
        setIsScanning(false);
        setFingerprintScanError('Fingerprint data not available.');
        setError('Unable to verify fingerprint. Missing stored credentials.');
        return;
      }

      // Verify fingerprint against stored credentials
      const result = await verifyFingerprint(fingerprintCredentials);

      if (result.success && result.credentialId) {
        // Find the matching device
        const matchedDevice = fingerprintDevices.find(
          d => d.fingerprintId === result.credentialId
        );

        if (matchedDevice) {
          setRetrievedDevice(matchedDevice);
          setFoundBy('fingerprint');
          setIsScanning(false);
        } else {
          setIsScanning(false);
          setFingerprintScanError('Device match not found.');
          setError('Fingerprint verified but device not found in system.');
        }
      } else {
        setIsScanning(false);
        setFingerprintScanError(result.message);
        setError(result.message);
      }
    } catch (err) {
      setIsScanning(false);
      const errorMsg = err instanceof Error ? err.message : 'Fingerprint verification failed';
      setFingerprintScanError(errorMsg);
      setError(errorMsg);
    }
  };

  const handleVerify = () => {
    if (retrievedDevice) {
      if (retrievedDevice.paymentStatus === 'PAY LATER') {
        alert('Please confirm payment first');
        return;
      }
      if (!agentName.trim()) {
        alert('Enter the agent name that is releasing this device');
        return;
      }

      const shouldRequirePin = foundBy !== 'fingerprint' || !fingerprintSupported;
      if (shouldRequirePin && retrievedDevice.retrievalPin) {
        if (!/^\d{4}$/.test(pinInput)) {
          alert('Enter the 4-digit retrieval PIN');
          return;
        }
        if (pinInput !== retrievedDevice.retrievalPin) {
          alert('Invalid retrieval PIN');
          return;
        }
      }

      const releaseAuthMethod =
        !shouldRequirePin && foundBy === 'fingerprint' ? 'fingerprint' : 'pin';

      const released: RegisteredDevice = {
        ...retrievedDevice,
        releasedBy: agentName.trim(),
        releaseAuthMethod,
      };

      onRetrieve(released);
      alert('Device verified and handed over successfully!');
      resetRetrieval();
    }
  };

  const resetRetrieval = () => {
    setMethod('selection');
    setQrInput('');
    setRetrievedDevice(null);
    setFoundBy(null);
    setAgentName(defaultAgentName ?? '');
    setPinInput('');
    setError(null);
    setIsScanning(false);
  };

  if (retrievedDevice) {
    const isPaid = retrievedDevice.paymentStatus === 'PAID';

    return (
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-lg mx-auto border-2 border-blue-50 relative overflow-hidden">
        {/* Payment Status Stamp */}
        <div className={`absolute top-6 right-6 px-6 py-2 border-4 rounded-lg font-black text-2xl rotate-12 animate-in fade-in zoom-in duration-300 ${
          isPaid ? 'border-green-500 text-green-500 bg-green-50/50' : 'border-red-500 text-red-500 bg-red-50/50 animate-pulse'
        }`}>
          {isPaid ? 'PAID' : 'PAY NOW'}
        </div>

        <div className="flex items-center gap-3 mb-6 text-blue-600">
          <CheckCircle2 className="w-6 h-6" />
          <h2 className="text-xl font-bold">Device Found</h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-6 p-4 bg-gray-50 rounded-xl">
            {retrievedDevice.photoUrl ? (
              <img src={retrievedDevice.photoUrl} alt="Device" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <Smartphone className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{retrievedDevice.deviceName}</h3>
              <div className="mt-2 space-y-1">
                <p className="flex items-center gap-2 text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                    {retrievedDevice.deviceType}
                  </span>
                  <span className="font-bold text-gray-900">₦{retrievedDevice.price.toLocaleString()}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" /> {retrievedDevice.username}
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" /> Pickup: {retrievedDevice.pickupDate}
                </p>
                <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Slot #{retrievedDevice.slotNumber}</p>
              </div>
            </div>
          </div>

          {!isPaid && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-red-800 font-bold mb-3">Total Amount Due: ₦{retrievedDevice.price.toLocaleString()}</p>
              <button
                onClick={handlePaymentConfirm}
                disabled={isProcessingPayment}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold animate-bounce shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? 'Processing...' : 'User Paid'}
              </button>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">Verification Required</p>
            <p className="text-xs text-yellow-700 mt-1">Please verify the device details and user identity before proceeding with the handover.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Releasing Agent
              </label>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent name"
                disabled={!!lockAgentName}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  lockAgentName ? 'bg-gray-50 text-gray-600' : ''
                }`}
              />
            </div>

            {(foundBy !== 'fingerprint' || !fingerprintSupported) && retrievedDevice.retrievalPin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  4-Digit PIN
                </label>
                <input
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                  inputMode="numeric"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVerify}
              disabled={!isPaid}
              className={`flex-1 py-3 rounded-lg font-bold transition-all shadow-md ${
                isPaid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Verify & Handover
            </button>
            <button
              onClick={() => setRetrievedDevice(null)}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (method === 'qr') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
        <button onClick={() => setMethod('selection')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Retrieve with QR</h2>
        <p className="text-gray-600 mb-8">Scan the user's receipt or enter the QR code manually.</p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Scan or enter QR code data..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <QrCode className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleQrSearch}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            Search Device
          </button>
        </div>
      </div>
    );
  }

  if (method === 'fingerprint') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-md mx-auto">
        <button onClick={() => setMethod('selection')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 text-left">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className={`relative inline-block mb-6 ${isScanning ? 'animate-pulse' : ''}`}>
          {isScanning && <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>}
          <div className={`relative p-8 rounded-full ${isScanning ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <Fingerprint className={`w-16 h-16 ${isScanning ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Fingerprint Retrieval</h2>
        <p className="text-gray-600 mb-8">
          {isScanning 
            ? 'Verifying your fingerprint...' 
            : fingerprintSupported
            ? 'Place your finger on the scanner to retrieve your device.'
            : 'Fingerprint scanner not available on this device.'}
        </p>

        {(error || fingerprintScanError) && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-6 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error || fingerprintScanError}</span>
          </div>
        )}

        <button
          onClick={handleFingerprintScan}
          disabled={isScanning || !fingerprintSupported}
          className={`w-full py-3 rounded-lg font-bold transition-colors ${
            isScanning || !fingerprintSupported
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isScanning ? 'Scanning...' : fingerprintSupported ? 'Start Fingerprint Scan' : 'Scanner Not Available'}
        </button>

        {!fingerprintSupported && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              Your device does not support biometric authentication. Please use QR code retrieval instead.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Retrieve Device</h2>
      <p className="text-gray-600 mb-8">Select a method to find the registered device.</p>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setMethod('qr')}
          className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Retrieve with QR</p>
            <p className="text-sm text-gray-500">Scan receipt or enter code</p>
          </div>
        </button>

        <button
          onClick={() => setMethod('fingerprint')}
          disabled={!fingerprintSupported}
          className={`flex items-center gap-4 p-5 border-2 rounded-xl transition-all text-left group ${
            fingerprintSupported
              ? 'border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
              : 'border-gray-100 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-lg transition-colors ${
            fingerprintSupported
              ? 'bg-emerald-100 group-hover:bg-emerald-200'
              : 'bg-gray-100'
          }`}>
            <Fingerprint className={`w-8 h-8 ${
              fingerprintSupported ? 'text-emerald-600' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <p className={`font-bold ${
              fingerprintSupported ? 'text-gray-800' : 'text-gray-500'
            }`}>
              Retrieve with Fingerprint
            </p>
            <p className="text-sm text-gray-500">
              {fingerprintSupported
                ? 'Scan biometric data'
                : 'Not available on this device'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
