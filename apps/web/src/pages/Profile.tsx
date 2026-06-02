import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import client from "../api/client";
import AddressList from "../components/address/AddressList";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setProfile(user);
      setFetching(false);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    if (!name.trim()) {
      setSaveError("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      const { data } = await client.patch<UserProfile>("/users/me", {
        name: name.trim(),
      });
      setProfile(data);
      setSaveSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al guardar"
          : "Error al guardar";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Información General
        </h2>

        <div className="mb-6 space-y-3">
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p className="text-gray-900 font-medium">{profile.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Roles</span>
            <div className="flex gap-2 mt-1">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="text-xs bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          {profile.permissions.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Permisos</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {saveError && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"
              role="alert"
            >
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm"
              role="alert"
            >
              Nombre actualizado correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        <AddressList />
      </div>
    </div>
  );
}
