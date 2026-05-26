import { BarChart3, Menu } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import RadialChart1 from "./components/RadialChart1";
import RadialChart2 from "./components/RadialChart2";
import RadialChart3 from "./components/RadialChart3";
import RadialChart4 from "./components/RadialChart4";
import RevenueChart from "./components/RevenueChart";
import CategoryChart from "./components/CategoryChart";
import TrafficChart from "./components/TrafficChart";
import PerformanceChart from "./components/PerformanceChart";
import DeviceRegistration, {
  type RegisteredDevice,
} from "./components/DeviceRegistration";
import DeviceCharging from "./components/DeviceCharging";
import DeviceRetrieval from "./components/DeviceRetrieval";
import RentPower, {
  type PowerBank,
  type PowerBankRental,
} from "./components/RentPower";
import AdminDashboard from "./components/AdminDashboard";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  localApiHealthCheck,
  localApiListDevices,
  localApiPatchDevice,
  localApiUpsertDevice,
} from "./utils/localApi";
import { supabase } from "./utils/supabaseClient";
import {
  appwriteAgentsEnabled,
  appwriteCreateAgent,
  appwriteCreateAgentInvite,
  appwriteDeleteAgent,
  appwriteEnabled,
  appwriteListAgentInvites,
  appwriteListAgents,
  appwriteListDevices,
  appwriteListPowerBanks,
  appwriteListRentals,
  appwritePowerBanksEnabled,
  appwriteRentalsEnabled,
  appwriteUpdateAgentInvite,
  appwriteUpsertDevice,
  appwriteUpdateDevice,
  appwriteUpsertPowerBank,
  appwriteUpsertRental,
} from "./utils/appwriteClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type AgentInvite = {
  id: string;
  code: string;
  role: "agent-sales" | "agent-audit" | "view-only";
  createdAt: string;
  usedAt?: string | null;
  usedByUsername?: string | null;
  usedByName?: string | null;
};

type AgentAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  role: "agent-sales" | "agent-audit" | "view-only";
  passwordHash: string;
  passwordSalt: string;
  passwordSha256Hex?: string;
  releasePinHash: string;
  releasePinSalt: string;
  releasePinSha256Hex?: string;
  createdAt: string;
};

const DEFAULT_POWER_BANKS: PowerBank[] = [
  {
    id: "pb1",
    name: "20,000 mAh Oraimo Power Bank",
    capacity: "20,000 mAh",
    brand: "Oraimo",
    pricePerDay: 1500,
    available: true,
    quantityAvailable: 6,
  },
  {
    id: "pb2",
    name: "15,000 mAh Itel Power Bank",
    capacity: "15,000 mAh",
    brand: "Itel",
    pricePerDay: 1200,
    available: true,
    quantityAvailable: 4,
  },
  {
    id: "pb3",
    name: "30,000 mAh New Age Power Bank",
    capacity: "30,000 mAh",
    brand: "New Age",
    pricePerDay: 2000,
    available: true,
    quantityAvailable: 3,
  },
  {
    id: "pb4",
    name: "10,000 mAh Samsung Power Bank",
    capacity: "10,000 mAh",
    brand: "Samsung",
    pricePerDay: 1000,
    available: true,
    quantityAvailable: 5,
  },
  {
    id: "pb5",
    name: "50,000 mAh Romoss Power Bank",
    capacity: "50,000 mAh",
    brand: "Romoss",
    pricePerDay: 3500,
    available: true,
    quantityAvailable: 2,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("agent-login");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminRouteVisible, setAdminRouteVisible] = useState(false);
  const supabaseEnabled = !!supabase;
  const [localApiEnabled, setLocalApiEnabled] = useState(false);
  const [agentInvites, setAgentInvites] = useState<AgentInvite[]>(() => {
    const saved = localStorage.getItem("agentInvites");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return (Array.isArray(parsed) ? parsed : []).map((i: any) => ({
        ...i,
        role: (i?.role || "agent-sales") as AgentInvite["role"],
      }));
    } catch {
      return [];
    }
  });
  const [agents, setAgents] = useState<AgentAccount[]>(() => {
    const saved = localStorage.getItem("agents");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
        ...a,
        role: (a?.role || "agent-sales") as AgentAccount["role"],
        email: String(a?.email || ""),
      }));
    } catch {
      return [];
    }
  });

  const [agentSession, setAgentSession] = useState<{
    username: string;
    role: AgentAccount["role"];
  } | null>(() => {
    const saved = localStorage.getItem("agentSession");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.username || !parsed?.role) return null;
      return {
        username: String(parsed.username),
        role: parsed.role as AgentAccount["role"],
      };
    } catch {
      return null;
    }
  });
  const [agentLoginUsername, setAgentLoginUsername] = useState("");
  const [agentLoginPassword, setAgentLoginPassword] = useState("");
  const [agentLoginError, setAgentLoginError] = useState("");
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);

  const [agentRegCode, setAgentRegCode] = useState("");
  const [agentRegName, setAgentRegName] = useState("");
  const [agentRegPhone, setAgentRegPhone] = useState("");
  const [agentRegEmail, setAgentRegEmail] = useState("");
  const [agentRegUsername, setAgentRegUsername] = useState("");
  const [agentRegPassword, setAgentRegPassword] = useState("");
  const [agentRegPin, setAgentRegPin] = useState("");
  const [agentRegRole, setAgentRegRole] = useState<
    "agent-sales" | "agent-audit" | "view-only"
  >("agent-sales");
  const [agentRegError, setAgentRegError] = useState("");
  const [agentRegSuccess, setAgentRegSuccess] = useState("");
  const [registeredDevices, setRegisteredDevices] = useState<
    RegisteredDevice[]
  >(() => {
    const saved = localStorage.getItem("registeredDevices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((d: RegisteredDevice) => ({
          ...d,
          registeredAt: new Date(d.registeredAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [deviceHistory, setDeviceHistory] = useState<RegisteredDevice[]>(() => {
    const saved = localStorage.getItem("deviceHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((d: RegisteredDevice) => ({
          ...d,
          registeredAt: new Date(d.registeredAt),
          retrievedAt: d.retrievedAt ? new Date(d.retrievedAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [rentals, setRentals] = useState<PowerBankRental[]>(() => {
    const saved = localStorage.getItem("powerBankRentals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({
          ...r,
          id: String(r.id || ""),
          powerBankId: String(r.powerBankId || ""),
          powerBankName: String(r.powerBankName || ""),
          userName: String(r.userName || ""),
          userPhone: String(r.userPhone || ""),
          userAddress: String(r.userAddress || ""),
          userPhoto: String(r.userPhoto || ""),
          qrData:
            typeof r.qrData === "string" && r.qrData
              ? r.qrData
              : JSON.stringify({
                  type: "powerbank_rental",
                  id: String(r.id || ""),
                }),
          rentalDate: r.rentalDate ? new Date(r.rentalDate) : new Date(),
          amountPaid: Number(r.amountPaid || 0),
          status: (r.status === "returned"
            ? "returned"
            : "active") as PowerBankRental["status"],
          returnedAt: r.returnedAt ? new Date(r.returnedAt) : undefined,
          returnedBy: r.returnedBy ? String(r.returnedBy) : undefined,
        })) as PowerBankRental[];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [powerBanks, setPowerBanks] = useState<PowerBank[]>(() => {
    const saved = localStorage.getItem("powerBanks");
    if (!saved) return DEFAULT_POWER_BANKS;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return DEFAULT_POWER_BANKS;
      return parsed.map((pb: any) => ({
        id: String(pb.id),
        name: String(pb.name || ""),
        capacity: String(pb.capacity || ""),
        brand: String(pb.brand || ""),
        pricePerDay: Number(pb.pricePerDay || 0),
        available: Boolean(pb.available ?? true),
        quantityAvailable: Number(pb.quantityAvailable ?? 0),
        image: pb.image ? String(pb.image) : undefined,
      }));
    } catch {
      return DEFAULT_POWER_BANKS;
    }
  });
  const [rentalReturnValue, setRentalReturnValue] = useState("");

  const [selectedRetrievedDevice, setSelectedRetrievedDevice] =
    useState<RegisteredDevice | null>(null);
  const [dailySummaryView, setDailySummaryView] = useState<"chart" | "table">(
    "chart",
  );
  const [revealedDeviceNames, setRevealedDeviceNames] = useState<
    Record<string, boolean>
  >({});
  const [thankYouToast, setThankYouToast] = useState<{
    name: string;
    at: number;
  } | null>(null);
  const [opsConsoleUnlocked, setOpsConsoleUnlocked] = useState(false);
  const [opsConsolePin, setOpsConsolePin] = useState("");
  const [opsConsoleError, setOpsConsoleError] = useState("");
  const [opsConsoleReturnTab, setOpsConsoleReturnTab] = useState("agent-login");
  const lastOpsConsoleToastDeviceIdRef = useRef<string | null>(null);
  const opsConsoleSeenRef = useRef(false);

  useEffect(() => {
    if (activeTab !== "ops-console") return;
    if (!opsConsoleUnlocked) {
      opsConsoleSeenRef.current = false;
      lastOpsConsoleToastDeviceIdRef.current = null;
      return;
    }
    const newest = [...registeredDevices].sort(
      (a, b) => b.registeredAt.getTime() - a.registeredAt.getTime(),
    )[0];
    if (!newest) return;

    if (!opsConsoleSeenRef.current) {
      opsConsoleSeenRef.current = true;
      lastOpsConsoleToastDeviceIdRef.current = newest.id;
      return;
    }

    if (newest.id !== lastOpsConsoleToastDeviceIdRef.current) {
      lastOpsConsoleToastDeviceIdRef.current = newest.id;
      setThankYouToast({ name: newest.username, at: Date.now() });
      setTimeout(() => setThankYouToast(null), 2000);
    }
  }, [activeTab, opsConsoleUnlocked, registeredDevices]);

  // Only save active devices (charging status) to keep localStorage size manageable
  useEffect(() => {
    if (appwriteEnabled) return;
    if (supabaseEnabled) return;
    if (localApiEnabled) return;
    try {
      localStorage.setItem(
        "registeredDevices",
        JSON.stringify(registeredDevices),
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes("QuotaExceededError")) {
        alert("Storage quota exceeded. Some old data may have been removed.");
        // Clear old data if quota is exceeded
        localStorage.removeItem("deviceHistory");
      }
    }
  }, [registeredDevices, supabaseEnabled, localApiEnabled]);

  // Save device history separately with a limit to prevent quota issues
  useEffect(() => {
    if (appwriteEnabled) return;
    if (supabaseEnabled) return;
    if (localApiEnabled) return;
    try {
      // Keep only last 500 retrieved devices to manage storage
      const limitedHistory = deviceHistory.slice(-500);
      localStorage.setItem("deviceHistory", JSON.stringify(limitedHistory));
    } catch (e) {
      console.error("Failed to save device history:", e);
    }
  }, [deviceHistory, supabaseEnabled, localApiEnabled]);

  useEffect(() => {
    if (appwriteAgentsEnabled) return;
    try {
      localStorage.setItem("agentInvites", JSON.stringify(agentInvites));
    } catch (e) {
      console.error("Failed to save agent invites:", e);
    }
  }, [agentInvites]);

  useEffect(() => {
    if (appwriteAgentsEnabled) return;
    try {
      localStorage.setItem("agents", JSON.stringify(agents));
    } catch (e) {
      console.error("Failed to save agents:", e);
    }
  }, [agents]);

  useEffect(() => {
    try {
      if (!agentSession) localStorage.removeItem("agentSession");
      else localStorage.setItem("agentSession", JSON.stringify(agentSession));
    } catch (e) {
      console.error("Failed to save agent session:", e);
    }
  }, [agentSession]);

  useEffect(() => {
    if (!agentSession) return;
    const stillExists = agents.some(
      (a) => a.username.toLowerCase() === agentSession.username.toLowerCase(),
    );
    if (!stillExists) setAgentSession(null);
  }, [agents, agentSession]);

  const refreshDevicesFromAppwrite = useCallback(async () => {
    if (!appwriteEnabled) return;
    try {
      const devices = await appwriteListDevices();
      setRegisteredDevices(devices.filter((d) => d.status === "charging"));
      setDeviceHistory(devices.filter((d) => d.status === "completed"));
    } catch (e) {
      console.error("Appwrite sync failed:", e);
    }
  }, []);

  const refreshAgentsFromAppwrite = useCallback(async () => {
    if (!appwriteAgentsEnabled) return;
    try {
      const [invites, agentDocs] = await Promise.all([
        appwriteListAgentInvites(),
        appwriteListAgents(),
      ]);

      const parsedInvites: AgentInvite[] = (invites || []).map((row: any) => ({
        id: row.id,
        code: String(row.code || ""),
        role: (row.role || "agent-sales") as AgentInvite["role"],
        createdAt: String(
          row.createdAt || row.$createdAt || new Date().toISOString(),
        ),
        usedAt: row.usedAt ?? null,
        usedByUsername: row.usedByUsername ?? null,
        usedByName: row.usedByName ?? null,
      }));

      const parsedAgents: AgentAccount[] = (agentDocs || []).map(
        (row: any) => ({
          id: row.id,
          name: String(row.name || ""),
          phone: String(row.phone || ""),
          email: String(row.email || ""),
          username: String(row.username || ""),
          role: (row.role || "agent-sales") as AgentAccount["role"],
          passwordHash: String(row.passwordHash || ""),
          passwordSalt: String(row.passwordSalt || ""),
          passwordSha256Hex: row.passwordSha256Hex
            ? String(row.passwordSha256Hex)
            : undefined,
          releasePinHash: String(row.releasePinHash || ""),
          releasePinSalt: String(row.releasePinSalt || ""),
          releasePinSha256Hex: row.releasePinSha256Hex
            ? String(row.releasePinSha256Hex)
            : undefined,
          createdAt: String(
            row.createdAt || row.$createdAt || new Date().toISOString(),
          ),
        }),
      );

      setAgentInvites(parsedInvites);
      setAgents(parsedAgents);
    } catch (e) {
      console.error("Appwrite agents sync failed:", e);
    }
  }, []);

  const refreshPowerBanksFromAppwrite = useCallback(async () => {
    if (!appwritePowerBanksEnabled) return;
    try {
      const list = await appwriteListPowerBanks();
      const normalized: PowerBank[] = (list || []).map((pb: any) => ({
        id: String(pb.id || pb.$id || ""),
        name: String(pb.name || ""),
        capacity: String(pb.capacity || ""),
        brand: String(pb.brand || ""),
        pricePerDay: Number(pb.pricePerDay || 0),
        available: Boolean(pb.available ?? true),
        quantityAvailable: Number(pb.quantityAvailable ?? 0),
        image: pb.image ? String(pb.image) : undefined,
      }));
      setPowerBanks(normalized.length ? normalized : DEFAULT_POWER_BANKS);
    } catch (e) {
      console.error("Appwrite power banks sync failed:", e);
    }
  }, []);

  const refreshRentalsFromAppwrite = useCallback(async () => {
    if (!appwriteRentalsEnabled) return;
    try {
      const list = await appwriteListRentals();
      const parsed: PowerBankRental[] = (list || []).map((r: any) => ({
        ...r,
        id: String(r.id || r.$id || ""),
        powerBankId: String(r.powerBankId || ""),
        powerBankName: String(r.powerBankName || ""),
        userName: String(r.userName || ""),
        userPhone: String(r.userPhone || ""),
        userAddress: String(r.userAddress || ""),
        userPhoto: String(r.userPhoto || ""),
        qrData:
          typeof r.qrData === "string" && r.qrData
            ? r.qrData
            : JSON.stringify({
                type: "powerbank_rental",
                id: String(r.id || r.$id || ""),
              }),
        rentalDate: r.rentalDate ? new Date(r.rentalDate) : new Date(),
        amountPaid: Number(r.amountPaid || 0),
        status: (r.status === "returned"
          ? "returned"
          : "active") as PowerBankRental["status"],
        returnedAt: r.returnedAt ? new Date(r.returnedAt) : undefined,
        returnedBy: r.returnedBy ? String(r.returnedBy) : undefined,
      }));
      setRentals(parsed);
    } catch (e) {
      console.error("Appwrite rentals sync failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!appwriteEnabled) return;
    refreshDevicesFromAppwrite();
    const poll = setInterval(() => {
      refreshDevicesFromAppwrite();
    }, 2000);
    return () => clearInterval(poll);
  }, [refreshDevicesFromAppwrite]);

  useEffect(() => {
    if (!appwriteAgentsEnabled) return;
    refreshAgentsFromAppwrite();
    const poll = setInterval(() => {
      refreshAgentsFromAppwrite();
    }, 5000);
    return () => clearInterval(poll);
  }, [refreshAgentsFromAppwrite]);

  useEffect(() => {
    if (!appwritePowerBanksEnabled) return;
    refreshPowerBanksFromAppwrite();
    const poll = setInterval(() => {
      refreshPowerBanksFromAppwrite();
    }, 5000);
    return () => clearInterval(poll);
  }, [refreshPowerBanksFromAppwrite]);

  useEffect(() => {
    if (!appwriteRentalsEnabled) return;
    refreshRentalsFromAppwrite();
    const poll = setInterval(() => {
      refreshRentalsFromAppwrite();
    }, 5000);
    return () => clearInterval(poll);
  }, [refreshRentalsFromAppwrite]);

  const refreshDevicesFromLocalApi = useCallback(async () => {
    try {
      const devices = await localApiListDevices();
      setRegisteredDevices(devices.filter((d) => d.status === "charging"));
      setDeviceHistory(devices.filter((d) => d.status === "completed"));
      setLocalApiEnabled(true);
    } catch {
      setLocalApiEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (appwriteEnabled) return;
    if (supabaseEnabled) return;
    localApiHealthCheck()
      .then(() => {
        setLocalApiEnabled(true);
        refreshDevicesFromLocalApi();
      })
      .catch(() => {
        setLocalApiEnabled(false);
      });
  }, [supabaseEnabled, refreshDevicesFromLocalApi]);

  useEffect(() => {
    if (appwriteEnabled) return;
    if (supabaseEnabled) return;
    if (!localApiEnabled) return;
    refreshDevicesFromLocalApi();
    const poll = setInterval(() => {
      refreshDevicesFromLocalApi();
    }, 2000);
    return () => clearInterval(poll);
  }, [supabaseEnabled, localApiEnabled, refreshDevicesFromLocalApi]);

  const refreshDevicesFromSupabase = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("registeredAt", { ascending: true });

    if (error) {
      console.error("Supabase devices fetch failed:", error);
      return;
    }

    const parsed: RegisteredDevice[] = (data || []).map((row: any) => ({
      ...row,
      registeredAt: row.registeredAt ? new Date(row.registeredAt) : new Date(),
      retrievedAt: row.retrievedAt ? new Date(row.retrievedAt) : undefined,
    }));

    setRegisteredDevices(parsed.filter((d) => d.status === "charging"));
    setDeviceHistory(parsed.filter((d) => d.status === "completed"));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;

    refreshDevicesFromSupabase();
    const poll = setInterval(() => {
      refreshDevicesFromSupabase();
    }, 5000);

    const channel = sb
      .channel("devices-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devices" },
        () => {
          refreshDevicesFromSupabase();
        },
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      sb.removeChannel(channel);
    };
  }, [refreshDevicesFromSupabase]);

  const handleHandover = (device: RegisteredDevice) => {
    // Remove from active devices and add to history
    setRegisteredDevices((prev) => prev.filter((d) => d.id !== device.id));

    // Add to history with retrieval timestamp
    const now = new Date();
    const retrievedAtTime = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const retrievedDevice: RegisteredDevice = {
      ...device,
      status: "completed",
      retrievedAt: now,
      retrievedAtTime,
    };

    setDeviceHistory((prev) => [...prev, retrievedDevice]);

    if (appwriteEnabled) {
      appwriteUpdateDevice(device.id, {
        status: "completed",
        retrievedAt: now,
        retrievedAtTime,
        paymentStatus: retrievedDevice.paymentStatus,
        releasedBy: retrievedDevice.releasedBy,
        releaseAuthMethod: retrievedDevice.releaseAuthMethod,
      }).catch((e) => console.error("Appwrite handover update failed:", e));
    }

    if (supabase) {
      supabase
        .from("devices")
        .update({
          status: "completed",
          retrievedAt: now.toISOString(),
          retrievedAtTime,
          paymentStatus: retrievedDevice.paymentStatus,
        })
        .eq("id", device.id)
        .then(({ error }) => {
          if (error) console.error("Supabase handover update failed:", error);
        });
    }

    if (localApiEnabled && !supabaseEnabled) {
      localApiPatchDevice(device.id, {
        status: "completed",
        retrievedAt: now.toISOString(),
        retrievedAtTime,
        paymentStatus: retrievedDevice.paymentStatus,
      }).catch(() => {});
    }
  };

  const handlePaymentUpdate = (deviceId: string) => {
    setRegisteredDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, paymentStatus: "PAID" } : d,
      ),
    );

    if (appwriteEnabled) {
      appwriteUpdateDevice(deviceId, { paymentStatus: "PAID" } as any).catch(
        (e) => console.error("Appwrite payment update failed:", e),
      );
    }

    if (supabase) {
      supabase
        .from("devices")
        .update({ paymentStatus: "PAID" })
        .eq("id", deviceId)
        .then(({ error }) => {
          if (error) console.error("Supabase payment update failed:", error);
        });
    }

    if (localApiEnabled && !supabaseEnabled) {
      localApiPatchDevice(deviceId, { paymentStatus: "PAID" }).catch(() => {});
    }
  };

  const handleRentPower = (rental: PowerBankRental) => {
    setRentals((prev) => [...prev, rental]);

    const current = powerBanks.find((pb) => pb.id === rental.powerBankId);
    if (current) {
      const nextQty = Math.max(0, Number(current.quantityAvailable || 0) - 1);
      const updated: PowerBank = {
        ...current,
        quantityAvailable: nextQty,
        available: nextQty > 0,
      };
      setPowerBanks((prev) =>
        prev.map((pb) => (pb.id === updated.id ? updated : pb)),
      );
      if (appwritePowerBanksEnabled) {
        appwriteUpsertPowerBank(updated).catch((e) =>
          console.error("Appwrite power bank update failed:", e),
        );
      }
    }

    if (appwriteRentalsEnabled) {
      appwriteUpsertRental(rental).catch((e) =>
        console.error("Appwrite rental create failed:", e),
      );
    }
  };

  const handleAddPowerBank = (powerBank: PowerBank) => {
    setPowerBanks((prev) => {
      const exists = prev.some((pb) => pb.id === powerBank.id);
      if (exists)
        return prev.map((pb) => (pb.id === powerBank.id ? powerBank : pb));
      return [...prev, powerBank];
    });

    if (appwritePowerBanksEnabled) {
      appwriteUpsertPowerBank(powerBank).catch((e) =>
        console.error("Appwrite power bank create failed:", e),
      );
    }
  };

  const parseRentalLookup = (raw: string): { id?: string } => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return {};
    if (/^\d+$/.test(trimmed)) return { id: trimmed };
    if (trimmed.startsWith("PB-RENTAL:"))
      return { id: trimmed.slice("PB-RENTAL:".length).trim() };
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.id || parsed.rentalId)
      ) {
        return { id: String(parsed.id || parsed.rentalId) };
      }
    } catch {}
    return { id: trimmed };
  };

  const handleReturnRental = (rentalIdOrQr: string) => {
    const lookup = parseRentalLookup(rentalIdOrQr);
    if (!lookup.id) return false;

    const current = rentals.find((r) => String(r.id) === String(lookup.id));
    if (!current) return false;
    if (current.status === "returned") return true;

    const returnedAt = new Date();
    const returnedBy =
      agentSession?.username || (isAdmin ? "admin" : "unknown");
    const updatedRental: PowerBankRental = {
      ...current,
      status: "returned",
      returnedAt,
      returnedBy,
    };
    setRentals((prev) =>
      prev.map((r) => (r.id === updatedRental.id ? updatedRental : r)),
    );
    if (appwriteRentalsEnabled) {
      appwriteUpsertRental(updatedRental).catch((e) =>
        console.error("Appwrite rental update failed:", e),
      );
    }

    const pb = powerBanks.find((p) => p.id === updatedRental.powerBankId);
    if (pb) {
      const nextQty = Math.max(0, Number(pb.quantityAvailable || 0) + 1);
      const updatedPB: PowerBank = {
        ...pb,
        quantityAvailable: nextQty,
        available: nextQty > 0,
      };
      setPowerBanks((prev) =>
        prev.map((p) => (p.id === updatedPB.id ? updatedPB : p)),
      );
      if (appwritePowerBanksEnabled) {
        appwriteUpsertPowerBank(updatedPB).catch((e) =>
          console.error("Appwrite power bank return update failed:", e),
        );
      }
    }

    return true;
  };

  const handleDeleteAgent = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (
      agentSession &&
      agent &&
      agentSession.username.toLowerCase() ===
        String(agent.username || "").toLowerCase()
    ) {
      setAgentSession(null);
    }
    if (appwriteAgentsEnabled) {
      appwriteDeleteAgent(id)
        .then(() => refreshAgentsFromAppwrite())
        .catch((e) => {
          console.error("Appwrite agent delete failed:", e);
          refreshAgentsFromAppwrite();
        });
    }
  };

  useEffect(() => {
    if (appwriteRentalsEnabled) return;
    if (supabaseEnabled) return;
    if (localApiEnabled) return;
    try {
      localStorage.setItem("powerBankRentals", JSON.stringify(rentals));
    } catch (e) {
      console.error("Failed to save rentals:", e);
    }
  }, [rentals, supabaseEnabled, localApiEnabled]);

  useEffect(() => {
    if (appwritePowerBanksEnabled) return;
    if (supabaseEnabled) return;
    if (localApiEnabled) return;
    try {
      localStorage.setItem("powerBanks", JSON.stringify(powerBanks));
    } catch (e) {
      console.error("Failed to save power banks:", e);
    }
  }, [powerBanks, supabaseEnabled, localApiEnabled]);

  const chargingDevices = registeredDevices;
  const retrievedDevices = deviceHistory;
  const currentAgentUsername = agentSession?.username?.trim().toLowerCase() || "";
  const agentChargingDevices = chargingDevices.filter((device) => {
    const registeredBy = String(device.registeredBy || "")
      .trim()
      .toLowerCase();
    return currentAgentUsername.length > 0 && registeredBy === currentAgentUsername;
  });
  const agentRetrievedDevices = retrievedDevices.filter((device) => {
    const registeredBy = String(device.registeredBy || "")
      .trim()
      .toLowerCase();
    const releasedBy = String(device.releasedBy || "")
      .trim()
      .toLowerCase();
    return (
      currentAgentUsername.length > 0 &&
      (registeredBy === currentAgentUsername || releasedBy === currentAgentUsername)
    );
  });
  const agentTotalCharge = agentRetrievedDevices.reduce(
    (sum, device) => sum + (typeof device.price === "number" ? device.price : 0),
    0,
  );

  // Live metrics counting from 0 based on session data
  const totalRegisteredCount =
    registeredDevices.length + retrievedDevices.length;
  const totalProcessedCount = retrievedDevices.length;
  const totalCompletedCount = retrievedDevices.length;
  const totalRevenueCount = retrievedDevices.reduce(
    (sum, d) => sum + d.price,
    0,
  );

  // Breakdown for Charging Donut Chart
  const phonesCharging = chargingDevices.filter(
    (d) => d.deviceType === "Phone",
  ).length;
  const powerBanksCharging = chargingDevices.filter(
    (d) => d.deviceType === "Power Bank",
  ).length;
  const othersCharging =
    chargingDevices.length - phonesCharging - powerBanksCharging;

  const TOTAL_SLOTS = 1000;
  const availableSlots = TOTAL_SLOTS - chargingDevices.length;
  const slotPercentage = (chargingDevices.length / TOTAL_SLOTS) * 100;

  const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const base64ToBytes = (base64: string) =>
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const randomSaltBase64 = (len = 16) => {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  };

  const deriveHash = async (value: string, saltBase64: string) => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(value),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64ToBytes(saltBase64),
        iterations: 100_000,
      },
      key,
      256,
    );
    return bytesToBase64(new Uint8Array(bits));
  };

  const sha256Hex = async (value: string) => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
    const bytes = new Uint8Array(digest);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const generate10DigitCode = () =>
    String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));

  const handleGenerateInvite = async (role: AgentInvite["role"]) => {
    const code = generate10DigitCode();
    const now = new Date().toISOString();
    const invitePayload = {
      code,
      role,
      createdAt: now,
      usedAt: null,
      usedByUsername: null,
      usedByName: null,
    };

    if (appwriteAgentsEnabled) {
      await appwriteCreateAgentInvite(invitePayload);
      await refreshAgentsFromAppwrite();
      return;
    }

    const local: AgentInvite = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      code,
      role,
      createdAt: now,
      usedAt: null,
      usedByUsername: null,
      usedByName: null,
    };
    setAgentInvites((prev) => [local, ...prev]);
  };

  useEffect(() => {
    const code = agentRegCode.trim();
    const invite = agentInvites.find((i) => i.code === code);
    if (invite && !invite.usedAt) {
      setAgentRegRole(invite.role);
    } else {
      setAgentRegRole("agent-sales");
    }
  }, [agentRegCode, agentInvites]);

  const handleAgentSignup = async () => {
    setAgentRegError("");
    setAgentRegSuccess("");

    const code = agentRegCode.trim();
    const name = agentRegName.trim();
    const phone = agentRegPhone.trim();
    const email = agentRegEmail.trim();
    const username = agentRegUsername.trim();
    const password = agentRegPassword;
    const pin = agentRegPin.trim();

    if (!/^\d{10}$/.test(code)) {
      setAgentRegError("Enter a valid 10-digit registration code");
      return;
    }
    if (!name || !phone || !email || !username) {
      setAgentRegError("Fill in name, phone number, email, and username");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAgentRegError("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setAgentRegError("Password must be at least 8 characters");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setAgentRegError("Releasing PIN must be a 4-digit number");
      return;
    }

    const invite = agentInvites.find((i) => i.code === code);
    if (!invite) {
      setAgentRegError("Invalid registration code");
      return;
    }
    if (invite.usedAt) {
      setAgentRegError("This registration code has already been used");
      return;
    }
    if (
      agents.some((a) => a.username.toLowerCase() === username.toLowerCase())
    ) {
      setAgentRegError("Username already exists");
      return;
    }
    if (agents.some((a) => String(a.email || "").toLowerCase() === email.toLowerCase())) {
      setAgentRegError("Email already exists");
      return;
    }

    const passwordSalt = randomSaltBase64(16);
    const releasePinSalt = randomSaltBase64(16);
    const [
      passwordHash,
      releasePinHash,
      passwordSha256Hex,
      releasePinSha256Hex,
    ] = await Promise.all([
      deriveHash(password, passwordSalt),
      deriveHash(pin, releasePinSalt),
      sha256Hex(`${passwordSalt}:${password}`),
      sha256Hex(`${releasePinSalt}:${pin}`),
    ]);
    const now = new Date().toISOString();

    const agentPayload = {
      name,
      phone,
      email,
      username,
      role: agentRegRole,
      passwordHash,
      passwordSalt,
      passwordSha256Hex,
      releasePinHash,
      releasePinSalt,
      releasePinSha256Hex,
      createdAt: now,
    };

    const updatedInvitePayload = {
      ...invite,
      usedAt: now,
      usedByUsername: username,
      usedByName: name,
    };

    if (appwriteAgentsEnabled) {
      await appwriteCreateAgent(agentPayload);
      await appwriteUpdateAgentInvite(invite.id, updatedInvitePayload);
      await refreshAgentsFromAppwrite();
      setAgentRegSuccess("Agent registered successfully");
      setAgentRegPassword("");
      setAgentRegPin("");
      return;
    }

    const localAgent: AgentAccount = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...agentPayload,
    };
    setAgents((prev) => [localAgent, ...prev]);
    setAgentInvites((prev) =>
      prev.map((i) => (i.id === invite.id ? updatedInvitePayload : i)),
    );
    setAgentRegSuccess("Agent registered successfully");
    setAgentRegPassword("");
    setAgentRegPin("");
  };

  const baseTabs = [
    { id: "summary", label: "Summary" },
    { id: "daily-summary", label: "Daily Summary" },
    { id: "ops-console", label: "Ops Console" },
    { id: "dashboard", label: "Dashboard" },
    { id: "device-registration", label: "Device Registration" },
    { id: "device-charging", label: "Device Charging" },
    { id: "retrieve-phone", label: "Retrieve Phone" },
    { id: "retrieved-list", label: "Total Charged" },
    { id: "rent-power", label: "Rent Power" },
    { id: "total-rentals", label: "Total Rentals" },
    { id: "agent-login", label: "Agent Login" },
    { id: "agent-signup", label: "Agent Sign Up" },
  ];

  const role = agentSession?.role;
  const canSeeAllStats = !!isAdmin || role === "agent-audit" || role === "view-only";
  const canPerformActions = !!isAdmin || role === "agent-sales";
  const canSeeDailySummary =
    !!isAdmin || role === "agent-sales" || role === "view-only";

  useEffect(() => {
    const applyHashRoute = () => {
      const raw = (window.location.hash || "")
        .replace(/^#/, "")
        .trim()
        .toLowerCase();
      const isAdminRoute =
        raw === "admin" || raw === "admin-insight" || raw === "admin-oversight";
      setAdminRouteVisible(isAdminRoute);
      if (isAdminRoute) {
        setActiveTab("admin");
        if (!isAdmin && role !== "agent-audit" && role !== "view-only") setShowAdminLogin(true);
      }
    };

    applyHashRoute();
    window.addEventListener("hashchange", applyHashRoute);
    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, [isAdmin, role]);

  const tabs =
    adminRouteVisible || activeTab === "admin"
      ? [...baseTabs, { id: "admin", label: "Admin Oversight" }]
      : baseTabs;

  const visibleTabIds = (() => {
    if (isAdmin) {
      return new Set(tabs.map((t) => t.id));
    }
    if (role === "agent-sales") {
      return new Set([
        "summary",
        "daily-summary",
        "ops-console",
        "device-registration",
        "device-charging",
        "retrieve-phone",
        "retrieved-list",
        "agent-login",
      ]);
    }
    if (role === "view-only") {
      return new Set([
        "summary",
        "daily-summary",
        "ops-console",
        "dashboard",
        "device-charging",
        "retrieved-list",
        "total-rentals",
        "admin",
        "agent-login",
      ]);
    }
    if (role === "agent-audit") {
      return new Set([
        "summary",
        "ops-console",
        "dashboard",
        "device-charging",
        "retrieved-list",
        "total-rentals",
        "admin",
        "agent-login",
      ]);
    }
    return new Set(["ops-console", "agent-login", "agent-signup", "admin"]);
  })();

  const visibleTabs = tabs.filter((t) => visibleTabIds.has(t.id));

  useEffect(() => {
    const allowed = visibleTabs.map((t) => t.id);
    if (allowed.includes(activeTab)) return;
    const first = allowed[0];
    if (first) setActiveTab(first);
  }, [activeTab, role, isAdmin]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "12345") {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
    } else {
      setAdminError("Invalid password. Please try again.");
    }
  };

  const handleTabClick = (tabId: string) => {
    if (!visibleTabIds.has(tabId)) {
      alert("Access denied");
      return;
    }
    if (tabId === "ops-console") {
      if (activeTab !== "ops-console") setOpsConsoleReturnTab(activeTab);
      setOpsConsoleUnlocked(false);
      setOpsConsolePin("");
      setOpsConsoleError("");
      setActiveTab(tabId);
      return;
    }
    if (tabId === "admin" && !isAdmin && role !== "agent-audit" && role !== "view-only") {
      setShowAdminLogin(true);
    } else {
      setActiveTab(tabId);
    }
  };

  console.log("App render check: app is mounting");

  const renderTabContent = () => {
    if (activeTab === "agent-login") {
      const currentAgent = agentSession
        ? agents.find(
            (a) =>
              a.username.toLowerCase() === agentSession.username.toLowerCase(),
          )
        : null;
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-6xl mx-auto border border-gray-100">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Agent Login
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Login to access the parts of the app based on your role.
              </p>
            </div>

            {agentSession ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAgentMenuOpen((v) => !v)}
                  className="w-11 h-11 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shadow-sm border border-blue-700"
                >
                  {String(currentAgent?.name || agentSession.username || "?")
                    .trim()
                    .slice(0, 1)
                    .toUpperCase()}
                </button>

                {agentMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden z-30">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Account
                      </div>
                      <div className="mt-1 text-lg font-black text-gray-900">
                        {currentAgent?.name || agentSession.username}
                      </div>
                      <div className="mt-1 text-xs font-mono font-bold text-gray-600">
                        {agentSession.username}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-semibold">Role</span>
                        <span className="font-bold text-gray-900">
                          {agentSession.role}
                        </span>
                      </div>
                      {currentAgent?.email && (
                        <div className="flex justify-between text-sm gap-3">
                          <span className="text-gray-500 font-semibold">
                            Email
                          </span>
                          <span className="font-semibold text-gray-900 truncate">
                            {currentAgent.email}
                          </span>
                        </div>
                      )}
                      {currentAgent?.phone && (
                        <div className="flex justify-between text-sm gap-3">
                          <span className="text-gray-500 font-semibold">
                            Phone
                          </span>
                          <span className="font-semibold text-gray-900">
                            {currentAgent.phone}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAgentMenuOpen(false);
                          setAgentSession(null);
                          setAgentLoginPassword("");
                          setAgentLoginError("");
                          setAgentLoginUsername("");
                        }}
                        className="w-full bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-black"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {!!agentLoginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold text-sm">
              {agentLoginError}
            </div>
          )}

          {agentSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <DeviceCharging
                  devices={chargingDevices}
                  isAdmin={false}
                  setIsAdmin={() => {}}
                  showAdminToggle={false}
                />
              </div>
              <div>
                <RentPower
                  powerBanks={powerBanks}
                  onAddPowerBank={handleAddPowerBank}
                  onRent={handleRentPower}
                  canAddPowerBank={isAdmin}
                  canRent={agentSession.role === "agent-sales" || isAdmin}
                />
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setAgentLoginError("");
                const u = agentLoginUsername.trim();
                if (!u) {
                  setAgentLoginError("Enter your username or email");
                  return;
                }
                if (agentLoginPassword.length < 8) {
                  setAgentLoginError("Password must be at least 8 characters");
                  return;
                }
                const needle = u.toLowerCase();
                const agent = agents.find(
                  (a) =>
                    a.username.toLowerCase() === needle ||
                    String(a.email || "").toLowerCase() === needle,
                );
                if (!agent) {
                  setAgentLoginError("Login details incorrect. Try again.");
                  return;
                }
                Promise.resolve()
                  .then(async () => {
                    if (agent.passwordSha256Hex && agent.passwordSalt) {
                      const got = (
                        await sha256Hex(
                          `${agent.passwordSalt}:${agentLoginPassword}`,
                        )
                      ).toLowerCase();
                      const expected = agent.passwordSha256Hex.toLowerCase();
                      return got === expected;
                    }
                    if (agent.passwordHash && agent.passwordSalt) {
                      const got = await deriveHash(
                        agentLoginPassword,
                        agent.passwordSalt,
                      );
                      return got === agent.passwordHash;
                    }
                    return false;
                  })
                  .then((ok) => {
                    if (!ok) {
                      setAgentLoginError("Login details incorrect. Try again.");
                      return;
                    }
                    setAgentSession({
                      username: agent.username,
                      role: agent.role,
                    });
                    setAgentMenuOpen(false);
                    setAgentLoginPassword("");
                    setAgentLoginError("");
                    setActiveTab("agent-login");
                  })
                  .catch(() => setAgentLoginError("Login failed. Try again."));
              }}
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Username or Email
                </label>
                <input
                  value={agentLoginUsername}
                  onChange={(e) => setAgentLoginUsername(e.target.value)}
                  placeholder="Username or email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={agentLoginPassword}
                  onChange={(e) => setAgentLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                Login
              </button>
            </form>
          )}
        </div>
      );
    }

    if (activeTab === "summary") {
      const currentAgent = agentSession
        ? agents.find(
            (agent) =>
              agent.username.toLowerCase() === agentSession.username.toLowerCase(),
          )
        : undefined;

      if (!agentSession) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Login required</h2>
            <p className="text-sm text-gray-500 mt-2">
              Sign in as an agent to view your personalized summary.
            </p>
          </div>
        );
      }

      const recentActivities = [
        ...agentChargingDevices.map((device) => ({
          type: "Charging" as const,
          title: device.deviceName,
          subtitle: device.username,
          amount: device.price,
          timestamp: device.registeredAt,
          meta: `${device.deviceType} • Slot ${device.slotNumber}`,
        })),
        ...agentRetrievedDevices.map((device) => ({
          type: "Retrieved" as const,
          title: device.deviceName,
          subtitle: device.username,
          amount: device.price,
          timestamp: device.retrievedAt || device.registeredAt,
          meta: `${device.deviceType} • ${device.paymentStatus}`,
        })),
      ]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      return (
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto border border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                Agent summary
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {currentAgent?.name || agentSession.username}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Personalized snapshot of your active and completed device activity.
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 font-semibold">
              Signed in as {agentSession.username}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Device charging
              </p>
              <div className="mt-3 text-3xl font-black text-gray-900">
                {agentChargingDevices.length}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Devices currently registered by this agent and still charging.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Retrieved devices
              </p>
              <div className="mt-3 text-3xl font-black text-gray-900">
                {agentRetrievedDevices.length}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Completed handovers tied to this agent’s records.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total charge
              </p>
              <div className="mt-3 text-3xl font-black text-gray-900">
                ₦{agentTotalCharge.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Revenue from the devices retrieved under this agent.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
                <p className="text-sm text-gray-500">
                  Latest charging and retrieval actions tied to your account.
                </p>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                No recent activity yet for this agent.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.title}-${activity.timestamp.getTime()}`}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₦{activity.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.type}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{activity.meta}</span>
                      <span>{activity.timestamp.toLocaleString("en-US")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "daily-summary") {
      if (!canSeeDailySummary) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      const todayChargingRevenue = retrievedDevices
        .filter(
          (d) =>
            d.retrievedAt &&
            d.retrievedAt >= startOfToday &&
            d.retrievedAt < endOfToday,
        )
        .reduce((sum, d) => sum + d.price, 0);
      const todayRetrievals = retrievedDevices.filter(
        (d) =>
          d.retrievedAt &&
          d.retrievedAt >= startOfToday &&
          d.retrievedAt < endOfToday,
      ).length;

      const todayRegisteredDevices = [
        ...chargingDevices,
        ...retrievedDevices,
      ].filter(
        (d) =>
          d.registeredAt &&
          d.registeredAt >= startOfToday &&
          d.registeredAt < endOfToday,
      );
      const todayReleasedDevices = retrievedDevices.filter(
        (d) =>
          d.retrievedAt &&
          d.retrievedAt >= startOfToday &&
          d.retrievedAt < endOfToday,
      );

      const perfMap = new Map<
        string,
        {
          agent: string;
          registrations: number;
          releases: number;
          activities: number;
          registeredRevenue: number;
        }
      >();
      for (const d of todayRegisteredDevices) {
        const agent = String(d.registeredBy || "").trim() || "Unknown";
        const row = perfMap.get(agent) || {
          agent,
          registrations: 0,
          releases: 0,
          activities: 0,
          registeredRevenue: 0,
        };
        row.registrations += 1;
        row.registeredRevenue += typeof d.price === "number" ? d.price : 0;
        row.activities = row.registrations + row.releases;
        perfMap.set(agent, row);
      }
      for (const d of todayReleasedDevices) {
        const agent = String(d.releasedBy || "").trim() || "Unknown";
        const row = perfMap.get(agent) || {
          agent,
          registrations: 0,
          releases: 0,
          activities: 0,
          registeredRevenue: 0,
        };
        row.releases += 1;
        row.activities = row.registrations + row.releases;
        perfMap.set(agent, row);
      }
      const perfRows = Array.from(perfMap.values()).sort(
        (a, b) => b.activities - a.activities,
      );
      const revenueRows = Array.from(perfMap.values()).sort(
        (a, b) => b.registeredRevenue - a.registeredRevenue,
      );

      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#14b8a6",
        "#6366f1",
      ];

      const countsPie = [
        { name: "Charging Now", value: chargingDevices.length },
        { name: "Registered Today", value: todayRegisteredDevices.length },
        { name: "Retrieved Today", value: todayRetrievals },
      ].filter((d) => d.value > 0);

      const activityPie = (() => {
        const rows = perfRows.filter((r) => r.activities > 0);
        const top = rows
          .slice(0, 6)
          .map((r) => ({ name: r.agent, value: r.activities }));
        const rest = rows.slice(6);
        const other = rest.reduce((sum, r) => sum + r.activities, 0);
        return other > 0 ? [...top, { name: "Others", value: other }] : top;
      })();

      const revenuePie = (() => {
        const rows = revenueRows.filter((r) => r.registeredRevenue > 0);
        const top = rows
          .slice(0, 6)
          .map((r) => ({ name: r.agent, value: r.registeredRevenue }));
        const rest = rows.slice(6);
        const other = rest.reduce((sum, r) => sum + r.registeredRevenue, 0);
        return other > 0 ? [...top, { name: "Others", value: other }] : top;
      })();

      const todayBalanceByType = (() => {
        const map = new Map<string, number>();
        for (const d of todayReleasedDevices) {
          const key = String(d.deviceType || "Unknown");
          map.set(
            key,
            (map.get(key) || 0) + (typeof d.price === "number" ? d.price : 0),
          );
        }
        return Array.from(map.entries())
          .map(([name, value]) => ({ name, value }))
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value);
      })();

      return (
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Daily Summary
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Today’s account balance and daily price totals.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {startOfToday.toLocaleDateString()}
                </span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Balance ₦{todayChargingRevenue.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                setDailySummaryView((v) => (v === "chart" ? "table" : "chart"))
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              {dailySummaryView === "chart" ? "Show in table" : "Show in chart"}
            </button>
          </div>

          {dailySummaryView === "chart" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Today Balance (by device type)
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Based on devices retrieved today
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ₦{todayChargingRevenue.toLocaleString()}
                  </span>
                </div>
                {todayBalanceByType.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-gray-400 font-semibold">
                    No balance yet today
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={todayBalanceByType}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {todayBalanceByType.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={colors[idx % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            `₦${Number(value || 0).toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Today Counts</h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Charging, registrations, retrievals
                    </p>
                  </div>
                </div>
                {countsPie.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-gray-400 font-semibold">
                    No activity yet today
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={countsPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {countsPie.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={colors[idx % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            Number(value || 0).toLocaleString()
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Agent Performance (Today)
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Activities = registrations + releases
                    </p>
                  </div>
                </div>
                {activityPie.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-gray-400 font-semibold">
                    No activity today
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={activityPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {activityPie.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={colors[idx % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            Number(value || 0).toLocaleString()
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Revenue by Agent (Today)
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Based on devices registered today
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    ₦
                    {todayRegisteredDevices
                      .reduce(
                        (sum, d) =>
                          sum + (typeof d.price === "number" ? d.price : 0),
                        0,
                      )
                      .toLocaleString()}
                  </span>
                </div>
                {revenuePie.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-gray-400 font-semibold">
                    No registrations today
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={revenuePie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {revenuePie.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={colors[idx % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) =>
                            `₦${Number(value || 0).toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Today Balance
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-900">
                    ₦{todayChargingRevenue.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-semibold">
                    Charging revenue only
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Charging Now
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-900">
                    {chargingDevices.length}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-semibold">
                    Devices currently charging
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Retrieved Today
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-900">
                    {todayRetrievals}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 font-semibold">
                    Completed handovers
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Agent Performance (Today)
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold">
                        Most activities: registrations + releases
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {startOfToday.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Agent</th>
                          <th className="px-4 py-3">Registrations</th>
                          <th className="px-4 py-3">Releases</th>
                          <th className="px-4 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {perfRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              No activity today
                            </td>
                          </tr>
                        ) : (
                          perfRows.slice(0, 10).map((row) => (
                            <tr
                              key={row.agent}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {row.agent}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-700">
                                {row.registrations}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-700">
                                {row.releases}
                              </td>
                              <td className="px-4 py-3 font-black text-gray-900">
                                {row.activities}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Revenue by Agent (Today)
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold">
                        Based on devices registered today
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ₦
                      {todayRegisteredDevices
                        .reduce(
                          (sum, d) =>
                            sum + (typeof d.price === "number" ? d.price : 0),
                          0,
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Agent</th>
                          <th className="px-4 py-3">Registrations</th>
                          <th className="px-4 py-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              No registrations today
                            </td>
                          </tr>
                        ) : (
                          revenueRows.slice(0, 10).map((row) => (
                            <tr
                              key={row.agent}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {row.agent}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-700">
                                {row.registrations}
                              </td>
                              <td className="px-4 py-3 font-black text-gray-900">
                                ₦{row.registeredRevenue.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTab === "ops-console") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      const todayRetrievals = retrievedDevices.filter(
        (d) =>
          d.retrievedAt &&
          d.retrievedAt >= startOfToday &&
          d.retrievedAt < endOfToday,
      ).length;

      const todayRegisteredDevices = [
        ...chargingDevices,
        ...retrievedDevices,
      ].filter(
        (d) =>
          d.registeredAt &&
          d.registeredAt >= startOfToday &&
          d.registeredAt < endOfToday,
      );

      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#14b8a6",
        "#6366f1",
      ];

      const todayDevicesByType = (() => {
        const map = new Map<string, number>();
        for (const d of todayRegisteredDevices) {
          const key = String(d.deviceType || "Unknown");
          map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries())
          .map(([name, value]) => ({ name, value }))
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value);
      })();

      return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <Sparkles className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-white/70">
                    Realtime
                  </div>
                  <div className="text-lg font-black leading-tight">
                    Operations Console
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-white/10 border border-white/10 text-white/80 px-2 py-1 rounded-full">
                  Charging {chargingDevices.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-7 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-black">Today Overview</div>
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Counts + balance composition
                      </div>
                    </div>
                    <Activity className="w-4 h-4 text-white/60" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative rounded-xl border border-white/10 bg-slate-950/30 p-3">
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">
                        Devices by type
                      </div>
                      {todayDevicesByType.length === 0 ? (
                        <div className="h-[150px] flex items-center justify-center text-white/50 font-semibold">
                          No registrations yet today
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: 150 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={todayDevicesByType.slice(0, 6)}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={3}
                              >
                                {todayDevicesByType
                                  .slice(0, 6)
                                  .map((_, idx) => (
                                    <Cell
                                      key={idx}
                                      fill={colors[idx % colors.length]}
                                    />
                                  ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: any) =>
                                  Number(value || 0).toLocaleString()
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-white/10" />
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">
                        Today counts
                      </div>
                      <div style={{ width: "100%", height: 150 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={[
                              {
                                name: "Charging",
                                value: chargingDevices.length,
                              },
                              {
                                name: "Registered",
                                value: todayRegisteredDevices.length,
                              },
                              { name: "Retrieved", value: todayRetrievals },
                            ]}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="rgba(255,255,255,0.08)"
                            />
                            <XAxis
                              dataKey="name"
                              stroke="rgba(255,255,255,0.5)"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              stroke="rgba(255,255,255,0.5)"
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              radius={[8, 8, 0, 0]}
                              fill="#3b82f6"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-black">Recent Charges</div>
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Last 3 registrations today
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-white/10 border border-white/10 text-white/80 px-2 py-1 rounded-full">
                      {todayRegisteredDevices.length}
                    </span>
                  </div>

                  <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-950/30 overflow-hidden">
                    {[...todayRegisteredDevices]
                      .sort(
                        (a, b) =>
                          b.registeredAt.getTime() - a.registeredAt.getTime(),
                      )
                      .slice(0, 3)
                      .map((d) => {
                        const revealed = !!revealedDeviceNames[d.id];
                        return (
                          <div
                            key={d.id}
                            className="px-3 py-2 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-white">
                                {d.username}
                              </div>
                              <div className="text-[10px] font-bold text-white/60 font-mono">
                                {d.registeredAtTime}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-black text-white/80 bg-white/10 border border-white/10 px-2 py-1 rounded-lg">
                                {revealed ? d.deviceName : "••••••"}
                              </div>
                              <button
                                onClick={() =>
                                  setRevealedDeviceNames((prev) => ({
                                    ...prev,
                                    [d.id]: !prev[d.id],
                                  }))
                                }
                                className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
                                aria-label={
                                  revealed
                                    ? "Hide device name"
                                    : "Show device name"
                                }
                              >
                                {revealed ? (
                                  <EyeOff className="w-4 h-4 text-white/80" />
                                ) : (
                                  <Eye className="w-4 h-4 text-white/80" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {todayRegisteredDevices.length === 0 && (
                      <div className="px-3 py-8 text-center text-white/50 font-semibold">
                        No registrations yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-black">
                        Currently Charging
                      </div>
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        Live slots
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-blue-500/15 border border-blue-400/20 text-blue-100 px-2 py-1 rounded-full">
                      {chargingDevices.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 place-items-center ">
                    {chargingDevices
                      .slice()
                      .sort(
                        (a, b) =>
                          b.registeredAt.getTime() - a.registeredAt.getTime(),
                      )
                      .slice(0, 9)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="rounded-xl w-fit  border border-white/10 bg-slate-950/30 px-2 py-2 flex flex-col items-center justify-center"
                        >
                          <div className="text-[10px] font-black text-white/70">
                            Slot
                          </div>
                          <div className="text-xs font-black text-white/60 blur-[3px] select-none">
                            #{d.slotNumber}
                          </div>
                          <div className="text-[10px] font-bold text-white/60 truncate w-full text-center">
                            {d.username}
                          </div>
                        </div>
                      ))}
                    {chargingDevices.length === 0 && (
                      <div className="col-span-3 py-6 text-center text-white/50 font-semibold">
                        No devices charging
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "dashboard") {
      if (!canSeeAllStats && !isAdmin) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Slot Management
                </h3>
                <p className="text-sm text-gray-500">
                  Device charging capacity
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {availableSlots}
                </span>
                <span className="text-gray-400 font-medium">
                  {" "}
                  / {TOTAL_SLOTS}
                </span>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">
                  Available Slots
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${slotPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-bold text-gray-400">
                {slotPercentage.toFixed(1)}% Occupied
              </span>
              <span className="text-xs font-bold text-gray-400">
                Total: {TOTAL_SLOTS}
              </span>
            </div>
          </div>

          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <RadialChart1
              phones={phonesCharging}
              powerBanks={powerBanksCharging}
              others={othersCharging}
              total={chargingDevices.length}
            />
            <RadialChart2 completedCount={totalCompletedCount} />
            <RadialChart3
              totalDevices={totalRegisteredCount}
              processedDevices={totalProcessedCount}
            />
            <RadialChart4 revenue={totalRevenueCount} />
          </main>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueChart devices={retrievedDevices} />
            <CategoryChart devices={retrievedDevices} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficChart />
            <PerformanceChart />
          </div>
        </>
      );
    }

    if (activeTab === "device-registration") {
      if (!canPerformActions) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <DeviceRegistration
          defaultRegisteredBy={agentSession?.username}
          lockRegisteredBy={!!agentSession?.username}
          showAgentOnReceipt={isAdmin}
          onRegister={(device) => {
            setRegisteredDevices((prev) => [...prev, device]);
            setThankYouToast({ name: device.username, at: Date.now() });
            setTimeout(() => setThankYouToast(null), 2000);
            if (appwriteEnabled) {
              appwriteUpsertDevice(device).catch((e) =>
                console.error("Appwrite register upsert failed:", e),
              );
            }
            if (supabase) {
              supabase
                .from("devices")
                .upsert({
                  ...device,
                  registeredAt: device.registeredAt.toISOString(),
                  retrievedAt: device.retrievedAt
                    ? device.retrievedAt.toISOString()
                    : null,
                })
                .then(({ error }) => {
                  if (error)
                    console.error("Supabase register upsert failed:", error);
                });
            }
            if (localApiEnabled && !supabaseEnabled) {
              localApiUpsertDevice(device).catch(() => {});
            }
          }}
          occupiedSlots={chargingDevices.map((d) => d.slotNumber)}
        />
      );
    }

    if (activeTab === "device-charging") {
      if (!canSeeAllStats && !isAdmin) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      const chargingAdminView = isAdmin || role === "agent-audit";
      return (
        <DeviceCharging
          devices={chargingDevices}
          isAdmin={chargingAdminView}
          setIsAdmin={isAdmin ? setIsAdmin : () => {}}
        />
      );
    }

    if (activeTab === "retrieve-phone") {
      if (!canPerformActions) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <DeviceRetrieval
          devices={chargingDevices}
          defaultAgentName={agentSession?.username}
          lockAgentName={!!agentSession?.username}
          onRetrieve={handleHandover}
          onPaymentUpdate={handlePaymentUpdate}
        />
      );
    }

    if (activeTab === "retrieved-list") {
      if (!canSeeAllStats && !isAdmin) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Total Charged Devices (Retrieved)
              </h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Click any row to view full details
              </p>
            </div>
          </div>
          {retrievedDevices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No devices retrieved yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 font-semibold text-gray-600">User</th>
                    <th className="py-4 font-semibold text-gray-600">Device</th>
                    <th className="py-4 font-semibold text-gray-600">Type</th>
                    <th className="py-4 font-semibold text-gray-600">
                      Registered By
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Released By
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Registered At
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Retrieved At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {retrievedDevices.map((device) => (
                    <tr
                      key={device.id}
                      onClick={() => setSelectedRetrievedDevice(device)}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 text-gray-800">{device.username}</td>
                      <td className="py-4 text-gray-800">
                        {device.deviceName}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                          {device.deviceType}
                        </span>
                      </td>
                      <td className="py-4 text-gray-800">
                        {device.registeredBy || "—"}
                      </td>
                      <td className="py-4 text-gray-800">
                        {device.releasedBy || "—"}
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        <div className="font-mono text-xs">
                          {device.registeredAtTime}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        <div className="font-mono text-xs">
                          {device.retrievedAtTime || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedRetrievedDevice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Device Details
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      {selectedRetrievedDevice.registrationId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRetrievedDevice(null)}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex gap-4 items-start">
                    {selectedRetrievedDevice.photoUrl ? (
                      <img
                        src={selectedRetrievedDevice.photoUrl}
                        alt="Device"
                        className="w-24 h-24 rounded-xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-100" />
                    )}
                    <div className="flex-1">
                      <div className="text-lg font-black text-gray-900">
                        {selectedRetrievedDevice.deviceName}
                      </div>
                      <div className="mt-1 text-sm text-gray-700 font-semibold">
                        {selectedRetrievedDevice.username}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                          {selectedRetrievedDevice.deviceType}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-800 text-xs font-bold">
                          ₦{selectedRetrievedDevice.price.toLocaleString()}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-800 text-xs font-bold">
                          Slot #{selectedRetrievedDevice.slotNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold ${
                            selectedRetrievedDevice.paymentStatus === "PAID"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {selectedRetrievedDevice.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Registered By
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {selectedRetrievedDevice.registeredBy || "—"}
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Registered At
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-700">
                      {selectedRetrievedDevice.registeredAtTime}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Released By
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {selectedRetrievedDevice.releasedBy || "—"}
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Retrieved At
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-700">
                      {selectedRetrievedDevice.retrievedAtTime || "—"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Pickup Date
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {selectedRetrievedDevice.pickupDate}
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Release Method
                    </div>
                    <div className="mt-1 font-bold text-gray-900">
                      {selectedRetrievedDevice.releaseAuthMethod || "—"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      QR Data
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-700 break-all">
                      {selectedRetrievedDevice.qrData || "—"}
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Fingerprint ID
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-700 break-all">
                      {selectedRetrievedDevice.fingerprintId || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "rent-power") {
      if (!canPerformActions) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <RentPower
          powerBanks={powerBanks}
          onAddPowerBank={handleAddPowerBank}
          onRent={handleRentPower}
        />
      );
    }

    if (activeTab === "total-rentals") {
      if (!canSeeAllStats && !isAdmin) {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          </div>
        );
      }
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            Power Bank Rental Records
          </h2>
          <div className="mb-6 bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-gray-900">
                Return a rented power bank
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                Scan/enter the rental QR text or the rental ID and mark returned
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                value={rentalReturnValue}
                onChange={(e) => setRentalReturnValue(e.target.value)}
                placeholder="Rental ID or QR data"
                className="flex-1 md:w-80 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const ok = handleReturnRental(rentalReturnValue);
                  if (!ok) alert("Rental not found. Please check the code.");
                  else alert("Rental marked as returned.");
                  setRentalReturnValue("");
                }}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-all"
              >
                Mark Returned
              </button>
            </div>
          </div>
          {rentals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No power bank rentals yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 font-semibold text-gray-600">User</th>
                    <th className="py-4 font-semibold text-gray-600">
                      Power Bank
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Rental ID
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Amount Paid
                    </th>
                    <th className="py-4 font-semibold text-gray-600">
                      Rental Date
                    </th>
                    <th className="py-4 font-semibold text-gray-600">Status</th>
                    <th className="py-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => (
                    <tr
                      key={rental.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {rental.userPhoto ? (
                            <img
                              src={rental.userPhoto}
                              className="w-10 h-10 rounded-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black">
                              {String(rental.userName || "?")
                                .trim()
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-gray-800 font-bold">
                              {rental.userName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {rental.userPhone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-800 font-medium">
                        {rental.powerBankName}
                      </td>
                      <td className="py-4 text-xs font-mono font-bold text-gray-700">
                        {rental.id}
                      </td>
                      <td className="py-4 font-bold text-gray-900">
                        ₦{rental.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {rental.rentalDate.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            rental.status === "returned"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {rental.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <button
                          type="button"
                          disabled={rental.status === "returned"}
                          onClick={() => {
                            const ok = handleReturnRental(rental.id);
                            if (!ok) alert("Rental not found.");
                          }}
                          className="px-3 py-2 rounded-lg font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "agent-signup") {
      return (
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Agent Registration
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter your 10-digit registration code and create your agent account.
          </p>

          {agentRegError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold text-sm">
              {agentRegError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                10-Digit Registration Code
              </label>
              <input
                value={agentRegCode}
                onChange={(e) =>
                  setAgentRegCode(
                    e.target.value.replace(/[^\d]/g, "").slice(0, 10),
                  )
                }
                placeholder="Enter 10-digit code"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                inputMode="numeric"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Role
              </label>
              <input
                value={agentRegRole}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-bold"
              />
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Role is assigned by the registration code
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                value={agentRegName}
                onChange={(e) => setAgentRegName(e.target.value)}
                placeholder="Agent name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                value={agentRegPhone}
                onChange={(e) => setAgentRegPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={agentRegEmail}
                onChange={(e) => setAgentRegEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Username
              </label>
              <input
                value={agentRegUsername}
                onChange={(e) => setAgentRegUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password (min 8 chars)
              </label>
              <input
                type="password"
                value={agentRegPassword}
                onChange={(e) => setAgentRegPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Releasing 4-Digit PIN
              </label>
              <input
                value={agentRegPin}
                onChange={(e) =>
                  setAgentRegPin(
                    e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                  )
                }
                placeholder="4-digit PIN"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono tracking-widest text-center"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setAgentRegError("");
                setAgentRegSuccess("");
                handleAgentSignup().catch((e) =>
                  setAgentRegError(
                    e instanceof Error ? e.message : "Registration failed",
                  ),
                );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Register Agent
            </button>
          </div>

          {agentRegSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Registration Successful
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Agent account created successfully.
                </p>
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-semibold">
                      Username
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {agentRegUsername}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setAgentRegSuccess("");
                      setAgentRegCode("");
                      setAgentRegName("");
                      setAgentRegPhone("");
                      setAgentRegUsername("");
                      setAgentRegPassword("");
                      setAgentRegPin("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "admin") {
      if (!isAdmin && role !== "agent-audit" && role !== "view-only") {
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-xl mx-auto border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Admin access required
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Open the admin page via #admin and login with the admin PIN.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAdminLogin(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                Admin Login
              </button>
            </div>
          </div>
        );
      }
      return (
        <AdminDashboard
          registeredDevices={registeredDevices}
          deviceHistory={deviceHistory}
          rentals={rentals}
          agentInvites={agentInvites}
          agents={agents.map((a) => ({
            id: a.id,
            name: a.name,
            phone: a.phone,
            username: a.username,
            role: a.role,
            createdAt: a.createdAt,
          }))}
          canGenerateInvites={isAdmin}
          canManageAgents={isAdmin}
          onGenerateInvite={(inviteRole) => {
            const normalized =
              inviteRole === "agent-sales" ||
              inviteRole === "agent-audit" ||
              inviteRole === "view-only"
                ? inviteRole
                : "agent-sales";
            handleGenerateInvite(normalized).catch((e) => console.error(e));
          }}
          onDeleteAgent={(id) => handleDeleteAgent(id)}
        />
      );
    }

    return null;
  };

  const isOpsConsole = activeTab === "ops-console";

  return (
    <div
      className={
        isOpsConsole
          ? "min-h-screen bg-slate-950"
          : "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      }
    >
      {isOpsConsole ? (
        <div className="min-h-screen w-full relative">
          <button
            onClick={() => {
              setOpsConsoleUnlocked(false);
              setOpsConsolePin("");
              setOpsConsoleError("");
              setActiveTab(opsConsoleReturnTab || "daily-summary");
            }}
            className="fixed top-4 left-4 z-[70] bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {!opsConsoleUnlocked ? (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
              <div className="w-full max-w-md relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
                <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
                <form
                  className="relative p-8"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pin = opsConsolePin.trim();
                    if (pin === "1234") {
                      setOpsConsoleUnlocked(true);
                      setOpsConsolePin("");
                      setOpsConsoleError("");
                      return;
                    }
                    setOpsConsoleError("Invalid PIN");
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-2 rounded-2xl bg-white/10 border border-white/10">
                      <Sparkles className="w-6 h-6 text-blue-200" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
                        Ops Console
                      </div>
                      <div className="mt-1 text-2xl font-black">Enter PIN</div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <input
                      autoFocus
                      inputMode="numeric"
                      value={opsConsolePin}
                      onChange={(e) => {
                        setOpsConsoleError("");
                        setOpsConsolePin(
                          e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                        );
                      }}
                      placeholder="••••"
                      className="w-full text-center tracking-[0.6em] font-black text-2xl px-4 py-4 rounded-2xl bg-white/10 border border-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                      type="password"
                    />
                    {!!opsConsoleError && (
                      <div className="mt-3 text-center text-sm font-bold text-red-200">
                        {opsConsoleError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3 font-black"
                  >
                    Unlock
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="min-h-screen w-full p-4">{renderTabContent()}</div>
          )}
        </div>
      ) : (
        <>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-500">
                      Real-time business insights
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
            <aside className="w-full sm:w-60 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <ul className="space-y-2">
                {visibleTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.id === "admin" &&
                        !isAdmin &&
                        role !== "agent-audit" && (
                          <Lock className="w-3 h-3 opacity-50" />
                        )}
                      {tab.id === "admin" && isAdmin && (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="flex-1">{renderTabContent()}</section>
          </div>

          {showAdminLogin && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-8">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Admin Access
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Enter your password to view sensitive analytics
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      autoFocus
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        adminError
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 focus:border-blue-500"
                      } focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`}
                      placeholder="Enter 5-digit PIN"
                    />
                    {adminError && (
                      <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {adminError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {thankYouToast && isOpsConsole && opsConsoleUnlocked && (
        <div className="fixed inset-0 z-[80] pointer-events-none overflow-hidden">
          <style>{`
@keyframes petalFall{0%{transform:translate3d(0,-60px,0) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translate3d(0,115vh,0) rotate(520deg);opacity:0}}
@keyframes confettiFall{0%{transform:translate3d(0,-60px,0) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translate3d(0,115vh,0) rotate(720deg);opacity:0}}
@keyframes drift{0%{margin-left:0}50%{margin-left:28px}100%{margin-left:-18px}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 48px rgba(16,185,129,0.55)}}
.petal{animation:petalFall 2s linear forwards, drift 2s ease-in-out forwards}
.confetti{animation:confettiFall 2s linear forwards, drift 2s ease-in-out forwards}
          `}</style>

          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[520px] max-w-[92vw]">
                <DotLottieReact src="/ops-console.lottie" loop autoplay />
              </div>
            </div>
          </div>

          {Array.from({ length: 12 }).map((_, i) => {
            const seed = (thankYouToast.at % 997) + i * 37;
            const left = (seed * 13) % 100;
            const size = 16 + ((seed * 7) % 14);
            const delay = ((seed * 11) % 60) / 1000;
            const color =
              i % 3 === 0 ? "#a7f3d0" : i % 3 === 1 ? "#93c5fd" : "#f0abfc";
            return (
              <span
                key={`petal_${i}`}
                className="absolute -top-12 opacity-90 petal"
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  fontSize: `${size}px`,
                  filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
                  color,
                }}
              >
                ✿
              </span>
            );
          })}

          {Array.from({ length: 26 }).map((_, i) => {
            const seed = (thankYouToast.at % 991) + i * 19;
            const left = (seed * 9) % 100;
            const delay = ((seed * 17) % 75) / 1000;
            const w = 6 + ((seed * 3) % 8);
            const h = 2 + ((seed * 5) % 6);
            const hue = (seed * 13) % 360;
            return (
              <span
                key={`conf_${i}`}
                className="absolute -top-12 rounded-sm confetti"
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  width: `${w}px`,
                  height: `${h}px`,
                  background: `hsl(${hue} 92% 70%)`,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                  transform: "translateZ(0)",
                  mixBlendMode: "screen",
                }}
              />
            );
          })}

          <div className="absolute inset-0 flex items-start justify-center pt-10 px-4">
            <div
              className="relative bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-300/30 px-5 py-4 flex items-center gap-3 animate-in fade-in zoom-in duration-150"
              style={{ animation: "glowPulse 2s ease-in-out forwards" }}
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
              <div className="font-black text-center">
                Thank you {thankYouToast.name} for trusting us
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
