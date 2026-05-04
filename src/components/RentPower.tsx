import { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { 
  Battery, 
  User, 
  Phone, 
  MapPin, 
  Image, 
  Upload, 
  CreditCard,
  Zap
} from "lucide-react";

export interface PowerBank {
  id: string;
  name: string;
  capacity: string;
  brand: string;
  pricePerDay: number;
  available: boolean;
  quantityAvailable: number;
  image?: string;
}

export interface PowerBankRental {
  id: string;
  powerBankId: string;
  powerBankName: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userPhoto: string;
  qrData: string;
  rentalDate: Date;
  amountPaid: number;
  status: 'active' | 'returned';
  returnedAt?: Date;
  returnedBy?: string;
}

interface RentPowerProps {
  powerBanks: PowerBank[];
  onAddPowerBank: (powerBank: PowerBank) => void;
  onRent: (rental: PowerBankRental) => void;
  canAddPowerBank?: boolean;
  canRent?: boolean;
}

export default function RentPower({
  powerBanks,
  onAddPowerBank,
  onRent,
  canAddPowerBank = true,
  canRent = true,
}: RentPowerProps) {
  const [selectedPB, setSelectedPB] = useState<PowerBank | null>(null);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isFamiliar, setIsFamiliar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddPowerBank, setShowAddPowerBank] = useState(false);
  const [newPBName, setNewPBName] = useState("");
  const [newPBCapacity, setNewPBCapacity] = useState("");
  const [newPBBrand, setNewPBBrand] = useState("");
  const [newPBPricePerDay, setNewPBPricePerDay] = useState<number>(0);
  const [newPBQty, setNewPBQty] = useState<number>(1);
  const [printRental, setPrintRental] = useState<PowerBankRental | null>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHire = () => {
    if (!selectedPB) return;

    if (!userName || !userPhone) {
      alert("Please enter the user's name and phone number.");
      return;
    }

    if (!isFamiliar && (!userAddress || !userPhoto)) {
      alert("Please fill in the address and provide an identification photo.");
      return;
    }

    setIsProcessing(true);

    // Simulate payment and processing
    setTimeout(() => {
      const rentalId = Date.now().toString();
      const qrData = JSON.stringify({
        type: "powerbank_rental",
        id: rentalId,
        powerBankId: selectedPB.id,
        powerBankName: selectedPB.name,
        userName,
        userPhone,
      });

      const rental: PowerBankRental = {
        id: rentalId,
        powerBankId: selectedPB.id,
        powerBankName: selectedPB.name,
        userName,
        userPhone,
        userAddress: isFamiliar ? "" : userAddress,
        userPhoto: isFamiliar ? "" : (userPhoto ?? ""),
        qrData,
        rentalDate: new Date(),
        amountPaid: selectedPB.pricePerDay,
        status: 'active'
      };

      onRent(rental);
      alert(`Payment Successful! ₦${selectedPB.pricePerDay.toLocaleString()} received. ${selectedPB.name} is now hired to ${userName}.`);
      setPrintRental(rental);
      resetForm();
      setIsProcessing(false);
    }, 1500);
  };

  const resetForm = () => {
    setSelectedPB(null);
    setUserName("");
    setUserPhone("");
    setUserAddress("");
    setUserPhoto(null);
    setIsFamiliar(false);
  };

  const resetAddPowerBankForm = () => {
    setNewPBName("");
    setNewPBCapacity("");
    setNewPBBrand("");
    setNewPBPricePerDay(0);
    setNewPBQty(1);
  };

  const handleAddPowerBank = () => {
    const name = newPBName.trim();
    const capacity = newPBCapacity.trim();
    const brand = newPBBrand.trim();
    const pricePerDay = Number(newPBPricePerDay || 0);
    const quantityAvailable = Math.max(0, Number(newPBQty || 0));

    if (!name || !capacity || !brand || pricePerDay <= 0 || quantityAvailable <= 0) {
      alert("Please fill in name, capacity, brand, price, and quantity.");
      return;
    }

    const id = `pb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    onAddPowerBank({
      id,
      name,
      capacity,
      brand,
      pricePerDay,
      quantityAvailable,
      available: quantityAvailable > 0,
    });

    resetAddPowerBankForm();
    setShowAddPowerBank(false);
  };

  const handlePrintLabel = () => {
    if (!printRental) return;
    const svg = qrWrapRef.current?.querySelector("svg");
    const svgMarkup = svg ? svg.outerHTML : "";
    const title = "Power Bank Rental";
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
      .row { display: flex; gap: 16px; align-items: center; }
      .qr { width: 180px; }
      .meta { font-size: 12px; line-height: 1.4; }
      .meta b { font-size: 13px; }
      .small { color: #374151; }
      .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="row">
        <div class="qr">${svgMarkup}</div>
        <div class="meta">
          <div><b>${printRental.powerBankName}</b></div>
          <div class="small">Rental ID: <span class="code">${printRental.id}</span></div>
          <div class="small">Name: <b>${printRental.userName}</b></div>
          <div class="small">Phone: <b>${printRental.userPhone}</b></div>
          <div class="small">Date: ${new Date(printRental.rentalDate).toLocaleString()}</div>
        </div>
      </div>
      <div style="margin-top:12px" class="small">Attach this label to the rented power bank.</div>
    </div>
    <script>
      window.onload = () => { window.focus(); window.print(); window.close(); };
    </script>
  </body>
</html>`;

    const w = window.open("", "_blank", "noopener,noreferrer,width=520,height=640");
    if (!w) {
      window.print();
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rent Power</h2>
          <p className="text-gray-500 mt-1">Select an available power bank to rent for the day.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!canAddPowerBank) return;
            setShowAddPowerBank(true);
          }}
          disabled={!canAddPowerBank}
          className={`bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
            canAddPowerBank ? "hover:bg-emerald-700" : "opacity-50 cursor-not-allowed"
          }`}
        >
          Add Power Bank
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {powerBanks.map((pb) => (
          <div 
            key={pb.id}
            className="border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all group bg-white"
          >
            <h3 className="text-2xl font-black text-gray-900 mb-2">{pb.capacity}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Qty available: <span className="font-black text-gray-900">{pb.quantityAvailable}</span>
            </p>
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
              <button
                onClick={() => {
                  if (!canRent) return;
                  setSelectedPB(pb);
                }}
                disabled={!canRent || pb.quantityAvailable <= 0}
                className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
              >
                Hire
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPB && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-xl text-white">
                  <Battery className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400">Power Bank</div>
                  <div className="text-xl font-black text-gray-900">{selectedPB.name}</div>
                  <div className="text-sm font-bold text-blue-600">₦{selectedPB.pricePerDay.toLocaleString()} / day</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFamiliar((prev) => {
                      const next = !prev;
                      if (next) {
                        setUserAddress("");
                        setUserPhoto(null);
                      }
                      return next;
                    });
                  }}
                  className={`px-3 py-2 rounded-xl font-black transition-all ${
                    isFamiliar
                      ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  Familiar
                </button>
                <button
                  onClick={resetForm}
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Capacity</div>
                <div className="text-lg font-black text-gray-900">{selectedPB.capacity}</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Brand</div>
                <div className="text-lg font-black text-gray-900">{selectedPB.brand}</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Qty available</div>
                <div className="text-lg font-black text-gray-900">{selectedPB.quantityAvailable}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {!isFamiliar && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Residential Address
                      </div>
                    </label>
                    <textarea
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="Enter your full address"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" /> Identification Photo (Mandatory)
                      </div>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                        userPhoto ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                    >
                      {userPhoto ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={userPhoto}
                            alt="User preview"
                            className="w-32 h-32 object-cover rounded-lg mb-2 shadow-sm"
                          />
                          <p className="text-xs text-blue-600 font-medium">Click to change photo</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-600 font-medium">Upload user photo</p>
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
                </>
              )}

              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-800">Pre-payment Required</p>
                  <p className="text-xs text-yellow-700">The daily rental fee of ₦{selectedPB.pricePerDay.toLocaleString()} must be paid before hiring.</p>
                </div>
              </div>

              <button
                onClick={handleHire}
                disabled={isProcessing || selectedPB.quantityAvailable <= 0}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>Processing Payment...</>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Pay ₦{selectedPB.pricePerDay.toLocaleString()} & Hire Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPowerBank && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Inventory</div>
                <div className="text-xl font-black text-gray-900">Add Power Bank</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetAddPowerBankForm();
                  setShowAddPowerBank(false);
                }}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  value={newPBName}
                  onChange={(e) => setNewPBName(e.target.value)}
                  placeholder="e.g. 20,000 mAh Oraimo Power Bank"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    value={newPBCapacity}
                    onChange={(e) => setNewPBCapacity(e.target.value)}
                    placeholder="e.g. 20,000 mAh"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <input
                    value={newPBBrand}
                    onChange={(e) => setNewPBBrand(e.target.value)}
                    placeholder="e.g. Oraimo"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per day (₦)</label>
                  <input
                    type="number"
                    value={Number.isFinite(newPBPricePerDay) ? newPBPricePerDay : 0}
                    onChange={(e) => setNewPBPricePerDay(Number(e.target.value))}
                    placeholder="e.g. 1500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity available</label>
                  <input
                    type="number"
                    value={Number.isFinite(newPBQty) ? newPBQty : 1}
                    onChange={(e) => setNewPBQty(Number(e.target.value))}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPowerBank}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
              >
                Save Power Bank
              </button>
            </div>
          </div>
        </div>
      )}

      {printRental && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">QR Label</div>
                <div className="text-xl font-black text-gray-900">Print Rental QR</div>
              </div>
              <button
                type="button"
                onClick={() => setPrintRental(null)}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>

            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                <div ref={qrWrapRef} className="bg-white p-3 rounded-xl border border-gray-200">
                  <QRCode value={printRental.qrData} size={160} />
                </div>
                <div className="text-sm">
                  <div className="font-black text-gray-900">{printRental.powerBankName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Rental ID: <span className="font-mono font-bold">{printRental.id}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Name: <span className="font-bold">{printRental.userName}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Phone: <span className="font-bold">{printRental.userPhone}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Date: <span className="font-semibold">{new Date(printRental.rentalDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 font-semibold">
                Attach this label to the rented power bank.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handlePrintLabel}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setPrintRental(null)}
                className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
