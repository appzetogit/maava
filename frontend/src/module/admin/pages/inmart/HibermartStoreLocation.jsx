import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api";
import {
  MapPin,
  Save,
  Navigation,
  Search,
  Store,
  ChevronRight,
  Loader2,
  Info
} from "lucide-react";

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function HibermartStoreLocation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState("Hibermart Store");
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    formattedAddress: "",
    address: ""
  });
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getHibermartStoreLocation();
        const data = response?.data?.data || response?.data;
        if (data) {
          setStoreName(data.name || "Hibermart Store");
          const loc = data.location || {};
          setLocation({
            latitude: loc.latitude ?? loc.coordinates?.[1] ?? null,
            longitude: loc.longitude ?? loc.coordinates?.[0] ?? null,
            formattedAddress: loc.formattedAddress || loc.address || "",
            address: loc.address || loc.formattedAddress || ""
          });
        }
      } catch (error) {
        console.error("Failed to load Hibermart store location:", error);
        toast.error("Failed to load Hibermart store location");
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();

    const fetchZones = async () => {
      try {
        const response = await adminAPI.getHibermartZones({ limit: 1000 });
        if (response.data?.success && response.data.data?.zones) {
          setZones(response.data.data.zones);
        }
      } catch (error) {
        console.error("Failed to fetch Hibermart zones:", error);
      }
    };
    fetchZones();
  }, []);

  const handleSave = async () => {
    try {
      if (!location.latitude || !location.longitude) {
        toast.error("Please pin the store location on the map");
        return;
      }
      setSaving(true);
      const payload = {
        name: storeName.trim() || "Hibermart Store",
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          coordinates: [location.longitude, location.latitude],
          formattedAddress: location.formattedAddress || location.address || "",
          address: location.address || location.formattedAddress || ""
        }
      };
      await adminAPI.updateHibermartStoreLocation(payload);
      toast.success("Hibermart store location saved successfully");
    } catch (error) {
      console.error("Failed to save Hibermart store location:", error);
      toast.error("Failed to save Hibermart store location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Loading Geospatial Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 lg:p-8 font-sans selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded">Admin</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Store Logistics</span>
            </div>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tighter leading-none">
              InMart <span className="text-neutral-300">Base Location</span>
            </h1>
            <p className="text-neutral-500 font-medium mt-3 max-w-lg">
              Set your Hibermart central storage point. This location determines delivery boy proximity and service zone availability.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-[1.8rem] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Deploying..." : "Save Base Point"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Config Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3">
                  Identification Name
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Hibermart Central"
                    className="w-full pl-11 pr-5 py-4 bg-neutral-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3">
                  Current Coordinates
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-neutral-900 text-white rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mb-1">Latitude</p>
                    <p className="text-sm font-black mono">{location.latitude?.toFixed(6) || "---"}</p>
                  </div>
                  <div className="p-4 bg-neutral-900 text-white rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mb-1">Longitude</p>
                    <p className="text-sm font-black mono">{location.longitude?.toFixed(6) || "---"}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3">
                  Resolved Address
                </label>
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 flex gap-4">
                  <Navigation className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-1" />
                  <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                    {location.formattedAddress || location.address || "Please click on the map to pin-point the store location."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-amber-900/70 leading-relaxed">
                <span className="block font-black uppercase tracking-widest text-amber-900 mb-1">PRO-TIP</span>
                This pin should represent the physical dispatch center. Delivery partners within 5-10km of this point will be notified first for new orders.
              </p>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-8">
            <div className="bg-white p-3 rounded-[3rem] border border-neutral-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-8 left-8 z-[100] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-100 shadow-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest">Interactive GIS Map</p>
              </div>

              <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-neutral-50 shadow-inner">
                <MapContainer
                  center={[
                    location.latitude || 20.5937,
                    location.longitude || 78.9629
                  ]}
                  zoom={location.latitude ? 16 : 5}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <StoreLocationPicker setLocation={setLocation} />
                  {location.latitude && location.longitude && (
                    <Marker position={{ lat: location.latitude, lng: location.longitude }}>
                      {/* Leaflet marker is standard */}
                    </Marker>
                  )}

                  {/* Render existing zones for reference */}
                  {zones.map((zone) => {
                    if (zone.coordinates && zone.coordinates.length >= 3) {
                      const path = zone.coordinates.map((c) => [c.latitude, c.longitude]);
                      return (
                        <Polygon
                          key={zone._id}
                          positions={path}
                          pathOptions={{
                            fillColor: "#f97316",
                            fillOpacity: 0.1,
                            color: "#ea580c",
                            weight: 1.5,
                            dashArray: "5, 5"
                          }}
                        >
                          <Tooltip sticky>
                            <div className="font-bold text-xs">{zone.name || "Hibermart Zone"}</div>
                            {zone.serviceLocation && <div className="text-[10px] opacity-75">{zone.serviceLocation}</div>}
                          </Tooltip>
                        </Polygon>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreLocationPicker({ setLocation }) {
  useMapEvents({
    click: async (event) => {
      const { lat, lng } = event.latlng;
      let formattedAddress = "";
      try {
        // Fallback to nominatim if custom geocode fails
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const result = await response.json();
        formattedAddress = result?.display_name || "";
      } catch (error) {
        console.error("Failed to reverse geocode Hibermart location:", error);
      }

      setLocation({
        latitude: lat,
        longitude: lng,
        formattedAddress,
        address: formattedAddress
      });

      toast.info("Location pinned: " + (formattedAddress.slice(0, 40) + "..."), {
        icon: <MapPin className="w-4 h-4" />
      });
    }
  });
  return null;
}
