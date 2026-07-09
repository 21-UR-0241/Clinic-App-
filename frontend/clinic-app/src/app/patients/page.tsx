'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface Patient {
  id: number;
  name: string;
  birthDate: string;
  gender: string;
  contactNumber: string;
  address: string;
}

const TAB_COLORS = [
  { tab: '#0F6D66', tint: '#E4F1EF' }, 
  { tab: '#B8823D', tint: '#F5EBDA' }, 
  { tab: '#B5583F', tint: '#F4E3DD' }, 
  { tab: '#3F5B70', tint: '#E1E9EE' }, 
  { tab: '#6B4C6B', tint: '#EBE1EB' }, 
  { tab: '#5C6B3F', tint: '#E7EBDC' }, 
];

function tabColorFor(id: number) {
  return TAB_COLORS[id % TAB_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}


function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" {...props}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" {...props}>
      <circle cx="9" cy="9" r="6" />
      <path d="M17 17l-3.5-3.5" />
    </svg>
  );
}
function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13.5 3.5a1.5 1.5 0 0 1 2 2L6 15l-3 1 1-3 9.5-9.5Z" />
    </svg>
  );
}
function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9a1.5 1.5 0 0 1-1.5 1.4H8.1A1.5 1.5 0 0 1 6.6 15L6 6" />
    </svg>
  );
}
function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}
function IconFolder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
      <path d="M6 13.5h9.5l3 3.5H34a1 1 0 0 1 1 1V30a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V14.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function IconLogout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M13 14l4-4-4-4M17 10H8" />
    </svg>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    contactNumber: '',
    address: '',
  });

 
  useEffect(() => {
    const token = document.cookie.split('; ').find((row) => row.startsWith('token='));
    if (!token) router.push('/login');
  }, [router]);


  const loadPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);


  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);


  useEffect(() => {
    if (showForm) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showForm]);

  const handleLogout = async () => {
    if (!window.confirm('Log out of your session?')) return;

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/patients/${editing.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      resetForm();
      await loadPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ name: '', birthDate: '', gender: '', contactNumber: '', address: '' });
  };

  const handleEdit = (patient: Patient) => {
    setEditing(patient);
    setFormData({
      name: patient.name,
      birthDate: patient.birthDate.split('T')[0],
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      address: patient.address,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this patient? This cannot be undone.')) {
      try {
        await api.delete(`/patients/${id}`);
        await loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.contactNumber.toLowerCase().includes(q)
    );
  }, [patients, search]);

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#16302B]">
      <nav className="sticky top-0 z-30 border-b border-[#DDE5E1] bg-[#F5F7F5]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F6D66] text-sm font-semibold text-white">
              +
            </span>
            <span className="font-['Fraunces',_Georgia,_serif] text-lg font-medium tracking-tight">
              Clinic App
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[#4B5D58] transition-colors hover:bg-[#EAEFEC] hover:text-[#16302B] motion-safe:transition"
          >
            <IconLogout className="h-4 w-4" />
            Log out
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-['Fraunces',_Georgia,_serif] text-3xl font-medium tracking-tight text-[#16302B]">
              Patient records
            </h1>
            <p className="mt-1 text-sm text-[#4B5D58]">
              {loading
                ? 'Loading records…'
                : `${patients.length} ${patients.length === 1 ? 'patient' : 'patients'} registered`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9C96]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or contact"
                className="w-56 rounded-md border border-[#DDE5E1] bg-white py-2 pl-9 pr-3 text-sm text-[#16302B] placeholder:text-[#8A9C96] focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#0F6D66] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B534E] motion-safe:transition"
            >
              <IconPlus className="h-4 w-4" />
              Add patient
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#DDE5E1] bg-white shadow-sm">
          {loading ? (
            <div className="divide-y divide-[#EEF2F0]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-[#EEF2F0]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 animate-pulse rounded bg-[#EEF2F0]" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#EEF2F0]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <IconFolder className="h-10 w-10 text-[#B7C6C0]" />
              {patients.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-[#16302B]">No patients yet</p>
                  <p className="max-w-xs text-sm text-[#4B5D58]">
                    Add the first patient to start building your records.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 rounded-md bg-[#0F6D66] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B534E]"
                  >
                    Add patient
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#16302B]">No matches</p>
                  <p className="max-w-xs text-sm text-[#4B5D58]">
                    No patients match "{search}". Try a different name or number.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#EEF2F0]">
                <thead>
                  <tr className="bg-[#FAFBFA]">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Birth date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F0]">
                  {filteredPatients.map((patient) => {
                    const color = tabColorFor(patient.id);
                    return (
                      <tr key={patient.id} className="group relative hover:bg-[#FAFBFA]">
                        <td className="relative whitespace-nowrap py-4 pl-6 pr-6">
                          {/* folder-tab accent */}
                          <span
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ backgroundColor: color.tab }}
                            aria-hidden="true"
                          />
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                              style={{ backgroundColor: color.tint, color: color.tab }}
                            >
                              {initials(patient.name)}
                            </span>
                            <span className="text-sm font-medium text-[#16302B]">{patient.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4B5D58]">
                          {formatDate(patient.birthDate)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full bg-[#EEF2F0] px-2.5 py-0.5 text-xs font-medium text-[#4B5D58]">
                            {patient.gender}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-['IBM_Plex_Mono',_ui-monospace,_monospace] text-sm text-[#4B5D58]">
                          {patient.contactNumber}
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-sm text-[#4B5D58]" title={patient.address}>
                          {patient.address}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(patient)}
                              aria-label={`Edit ${patient.name}`}
                              className="rounded-md p-2 text-[#4B5D58] transition-colors hover:bg-[#F5EBDA] hover:text-[#B8823D] motion-safe:transition"
                            >
                              <IconEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              aria-label={`Delete ${patient.name}`}
                              className="rounded-md p-2 text-[#4B5D58] transition-colors hover:bg-[#F4E3DD] hover:text-[#A6403A] motion-safe:transition"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-form-title"
        >
          <button
            aria-label="Close form"
            onClick={resetForm}
            className="absolute inset-0 bg-[#16302B]/30 backdrop-blur-[2px] motion-safe:transition-opacity"
          />
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl motion-safe:animate-[popIn_0.18s_ease-out]">
            <div className="flex items-center justify-between border-b border-[#EEF2F0] px-6 py-5">
              <h2
                id="patient-form-title"
                className="font-['Fraunces',_Georgia,_serif] text-xl font-medium text-[#16302B]"
              >
                {editing ? 'Edit patient' : 'Add patient'}
              </h2>
              <button
                onClick={resetForm}
                aria-label="Close"
                className="rounded-md p-1.5 text-[#4B5D58] hover:bg-[#EEF2F0]"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Rivera"
                    className="w-full rounded-md border border-[#DDE5E1] px-3 py-2 text-sm focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                    Birth date
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[#DDE5E1] px-3 py-2 text-sm focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[#DDE5E1] px-3 py-2 text-sm focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                    Contact number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+1 555 010 2938"
                    className="w-full rounded-md border border-[#DDE5E1] px-3 py-2 text-sm focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#7C8D87]">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, city, region"
                    rows={3}
                    className="w-full resize-none rounded-md border border-[#DDE5E1] px-3 py-2 text-sm focus:border-[#0F6D66] focus:outline-none focus:ring-2 focus:ring-[#0F6D66]/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#EEF2F0] px-6 py-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-md border border-[#DDE5E1] py-2 text-sm font-medium text-[#4B5D58] transition-colors hover:bg-[#F5F7F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-[#0F6D66] py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B534E]"
                >
                  {editing ? 'Save changes' : 'Add patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}