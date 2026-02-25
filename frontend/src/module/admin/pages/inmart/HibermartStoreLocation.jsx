import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/config";

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
      toast.success("Hibermart store location saved");
    } catch (error) {
      console.error("Failed to save Hibermart store location:", error);
      toast.error("Failed to save Hibermart store location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Hibermart Store Location</h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">
            Pin the Hibermart store pickup location used for delivery assignment and zone matching.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Location"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Store Name
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <MapContainer
            center={[
              location.latitude || 20.5937,
              location.longitude || 78.9629
            ]}
            zoom={location.latitude ? 15 : 5}
            style={{ height: "320px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <StoreLocationPicker setLocation={setLocation} />
            {location.latitude && location.longitude && (
              <Marker position={{ lat: location.latitude, lng: location.longitude }} />
            )}
          </MapContainer>
        </div>

        <div className="mt-3 text-xs text-slate-600">
          <div>Lat: {location.latitude?.toFixed(6) || "N/A"} | Lng: {location.longitude?.toFixed(6) || "N/A"}</div>
          <div className="mt-1">Address: {location.formattedAddress || location.address || "Not set"}</div>
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
        const response = await fetch(`${API_BASE_URL}/geocode/reverse?lat=${lat}&lon=${lng}`);
        const result = await response.json();
        const data = result?.data || result;
        formattedAddress = data?.display_name || "";
      } catch (error) {
        console.error("Failed to reverse geocode Hibermart location:", error);
      }

      setLocation({
        latitude: lat,
        longitude: lng,
        formattedAddress,
        address: formattedAddress
      });
    }
  });
  return null;
}
