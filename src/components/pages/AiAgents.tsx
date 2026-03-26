import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSmartToy,
  MdSave,
  MdRefresh,
  MdClose,
  MdCheckCircle,
  MdPauseCircle,
  MdLink,
  MdLinkOff,
  MdVideoCall,
  MdCalendarMonth,
} from 'react-icons/md';
import { SiHubspot } from 'react-icons/si';
import { getAiAgentsByUserId, createAiAgent, updateAiAgent, deleteAiAgent, getAiIntegrations, setAiIntegrations, deleteAiIntegrations } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { AiAgent } from '../../types/api.types';

const AiAgents: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Agent create/edit modal ──────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    agentTitle: '',
    instructions: '',
    isActive: false,
  });

  // ── Integration modal ────────────────────────────────────
  const [integrationAgent, setIntegrationAgent] = useState<AiAgent | null>(null);
  const [integrationData, setIntegrationData] = useState<{ zoom: string; hubspot: string; google: string }>({
    zoom: '',
    hubspot: '',
    google: '',
  });
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<'zoom' | 'hubspot' | 'google'>('zoom');

  useEffect(() => {
    if (user) fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await getAiAgentsByUserId(user.id);
    if (result.success && result.data) {
      setAgents(
        [...result.data].sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    } else {
      setError(result.message || 'Failed to fetch AI agents');
    }
    setLoading(false);
  };

  // ── Agent modal handlers ─────────────────────────────────
  const handleOpenModal = (agent?: AiAgent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        agentTitle: agent.agentTitle,
        instructions: agent.instructions,
        isActive: agent.isActive,
      });
    } else {
      setEditingAgent(null);
      setFormData({ name: '', agentTitle: '', instructions: '', isActive: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    setFormData({ name: '', agentTitle: '', instructions: '', isActive: false });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingAgent) {
        const result = await updateAiAgent(editingAgent.id, {
          name: formData.name,
          agentTitle: formData.agentTitle,
          instructions: formData.instructions,
          isActive: formData.isActive,
        });
        if (result.success) {
          await fetchAgents();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to update agent');
        }
      } else {
        const result = await createAiAgent({
          userId: user.id,
          name: formData.name,
          agentTitle: formData.agentTitle,
          instructions: formData.instructions,
          isActive: formData.isActive,
        });
        if (result.success) {
          await fetchAgents();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to create agent');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this AI agent?')) return;
    const result = await deleteAiAgent(id);
    if (result.success) {
      await fetchAgents();
    } else {
      setError(result.message || 'Failed to delete agent');
    }
  };

  // ── Integration modal handlers ───────────────────────────
  const handleOpenIntegrations = async (agent: AiAgent) => {
    setIntegrationAgent(agent);
    setActiveIntegrationTab('zoom');
    setIntegrationData({ zoom: '', hubspot: '', google: '' });
    setIntegrationLoading(true);
    const result = await getAiIntegrations(agent.id);
    if (result.success && result.data) {
      setIntegrationData({
        zoom: result.data.zoom || '',
        hubspot: result.data.hubspot || '',
        google: result.data.google || '',
      });
    }
    setIntegrationLoading(false);
  };

  const handleCloseIntegrations = () => {
    setIntegrationAgent(null);
    setIntegrationData({ zoom: '', hubspot: '', google: '' });
  };

  const handleSaveIntegrations = async () => {
    if (!integrationAgent) return;
    setIntegrationSaving(true);
    const payload: { zoom?: string | null; hubspot?: string | null; google?: string | null } = {
      zoom: integrationData.zoom || null,
      hubspot: integrationData.hubspot || null,
      google: integrationData.google || null,
    };
    const result = await setAiIntegrations(integrationAgent.id, payload);
    if (!result.success) {
      setError(result.message || 'Failed to save integrations');
    }
    setIntegrationSaving(false);
    handleCloseIntegrations();
  };

  const handleDeleteIntegrations = async () => {
    if (!integrationAgent) return;
    if (!window.confirm('Remove all meeting links for this agent?')) return;
    setIntegrationSaving(true);
    await deleteAiIntegrations(integrationAgent.id);
    setIntegrationSaving(false);
    handleCloseIntegrations();
  };

  const isFormValid = formData.name.trim() && formData.agentTitle.trim() && formData.instructions.trim();

  // ── Integration tab config ───────────────────────────────
  const integrationTabs: {
    key: 'zoom' | 'hubspot' | 'google';
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    color: string;
  }[] = [
      {
        key: 'zoom',
        label: 'Zoom',
        icon: <MdVideoCall />,
        placeholder: 'https://zoom.us/j/...',
        color: '#2D8CFF',
      },
      {
        key: 'hubspot',
        label: 'HubSpot',
        icon: <SiHubspot />,
        placeholder: 'https://meetings.hubspot.com/...',
        color: '#FF7A59',
      },
      {
        key: 'google',
        label: 'Google Meet',
        icon: <MdCalendarMonth />,
        placeholder: 'https://calendar.google.com/...',
        color: '#1A73E8',
      },
    ];

  return (
    <div className="ai-agents-page">
      {/* Page Header */}
      <div className="ai-agents-header">
        <div className="header-content">
          <div>
            <h1>AI Agents</h1>
            <p>Deploy intelligent assistants to handle your conversations</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn secondary" onClick={fetchAgents} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Sync
            </button>
            <button className="btn primary" onClick={() => handleOpenModal()} style={{ background: 'var(--agent-primary-gradient)', border: 'none' }}>
              <MdAdd />
              New Agent
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Section */}
      <div className="ai-agents-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><MdSmartToy /></div>
          <div className="stat-info">
            <h3>{agents.length}</h3>
            <p>Total Managed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><MdCheckCircle /></div>
          <div className="stat-info">
            <h3>{agents.filter(a => a.isActive).length}</h3>
            <p>Actively Responding</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon muted"><MdPauseCircle /></div>
          <div className="stat-info">
            <h3>{agents.filter(a => !a.isActive).length}</h3>
            <p>Currently Paused</p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="ai-agents-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Optimizing agent configurations...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <MdSmartToy className="empty-icon" />
            <h3>Your Workforce is Empty</h3>
            <p>Create your first AI agent to start handling WhatsApp conversations with human-like intelligence.</p>
            <button className="btn primary" onClick={() => handleOpenModal()} style={{ background: 'var(--agent-primary-gradient)', border: 'none' }}>
              <MdAdd />
              Build Your First Agent
            </button>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-identity">
                  <div className="agent-avatar"><MdSmartToy /></div>
                  <div className="agent-title-group">
                    <h3>{agent.name}</h3>
                    <span className="agent-role">{agent.agentTitle}</span>
                  </div>
                </div>
                <div className="agent-actions">
                  <span className={`status-badge ${agent.isActive ? 'active' : 'inactive'}`}>
                    {agent.isActive ? 'Live' : 'Paused'}
                  </span>
                  <button
                    className="icon-btn integration"
                    onClick={() => handleOpenIntegrations(agent)}
                    title="Meetings"
                  >
                    <MdLink />
                  </button>
                  <button className="icon-btn" onClick={() => handleOpenModal(agent)} title="Edit">
                    <MdEdit />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(agent.id)} title="Remove">
                    <MdDelete />
                  </button>
                </div>
              </div>

              <div className="agent-card-body">
                <div className="instructions-preview">
                  <label>Operational Persona</label>
                  <p>{agent.instructions}</p>
                </div>
                <div className="agent-meta">
                  <div className="meta-item">
                    <span className="meta-label">Provisioned</span>
                    <span className="meta-value">{new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Last Updated</span>
                    <span className="meta-value">{new Date(agent.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAgent ? 'Refine AI Agent' : 'Provision AI Agent'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="agentName">Identity Name *</label>
                <input
                  type="text"
                  id="agentName"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sara"
                  className="form-input"
                />
                <small className="form-help">How the agent identifies itself in digital interactions</small>
              </div>
              <div className="form-group">
                <label htmlFor="agentTitle">Professional Title *</label>
                <input
                  type="text"
                  id="agentTitle"
                  value={formData.agentTitle}
                  onChange={e => setFormData({ ...formData, agentTitle: e.target.value })}
                  placeholder="e.g., Customer Support Specialist"
                  className="form-input"
                />
                <small className="form-help">The official role assigned to this intelligence</small>
              </div>
              <div className="form-group">
                <label htmlFor="agentInstructions">Operational Instructions *</label>
                <textarea
                  id="agentInstructions"
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Define behavior, scope, and tone of voice..."
                  className="form-textarea"
                  rows={6}
                />
                <div className="character-count">{formData.instructions.length} tokens</div>
              </div>
              {editingAgent && (
                <div className="form-group">
                  <label>External Integrations</label>
                  <button
                    className="btn secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', borderRadius: '12px' }}
                    type="button"
                    onClick={() => {
                      const agent = editingAgent;
                      handleCloseModal();
                      if (agent) handleOpenIntegrations(agent);
                    }}
                  >
                    <MdLink style={{ color: 'var(--agent-primary)' }} />
                    Secure Meeting Integrations
                  </button>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="agentStatus">Operational Status</label>
                <select
                  id="agentStatus"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="form-select"
                >
                  <option value="active">Active (Deploy)</option>
                  <option value="inactive">Inactive (Draft)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal}>Cancel</button>
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={!isFormValid || saving}
                style={{ background: 'var(--agent-primary-gradient)', border: 'none' }}
              >
                <MdSave />
                {saving ? 'Processing...' : editingAgent ? 'Save Changes' : 'Initialize Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Integration Modal ──────────────────────────────── */}
      {integrationAgent && (
        <div className="modal-overlay" onClick={handleCloseIntegrations}>
          <div className="modal-content integration-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--agent-primary)' }}>
                  <MdLink size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bridge Integrations</h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>{integrationAgent.name} • {integrationAgent.agentTitle}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseIntegrations}><MdClose /></button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
              {integrationLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p style={{ color: '#64748b' }}>Fetching secure links...</p>
                </div>
              ) : (
                <>
                  <div className="integration-tabs">
                    {integrationTabs.map(tab => (
                      <button
                        key={tab.key}
                        className={`integration-tab ${activeIntegrationTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveIntegrationTab(tab.key)}
                        style={{ color: activeIntegrationTab === tab.key ? tab.color : '' }}
                      >
                        <span style={{ fontSize: '1.2rem', display: 'flex' }}>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {integrationTabs.filter(t => t.key === activeIntegrationTab).map(tab => (
                    <div key={tab.key} className="integration-input-section" style={{ marginTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1rem' }}>
                        {tab.label} Endpoint URL
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="url"
                          className="form-input"
                          placeholder={tab.placeholder}
                          value={integrationData[tab.key]}
                          onChange={e => setIntegrationData(prev => ({ ...prev, [tab.key]: e.target.value }))}
                          style={{ paddingRight: '3rem', borderColor: integrationData[tab.key] ? tab.color : '' }}
                        />
                        {integrationData[tab.key] && (
                          <button
                            onClick={() => setIntegrationData(prev => ({ ...prev, [tab.key]: '' }))}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <MdClose />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={handleDeleteIntegrations}
                style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fee2e2' }}
              >
                Clear All
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn secondary" onClick={handleCloseIntegrations}>Dismiss</button>
                <button
                  className="btn primary"
                  onClick={handleSaveIntegrations}
                  disabled={integrationSaving}
                  style={{ background: 'var(--agent-primary-gradient)', border: 'none' }}
                >
                  <MdSave />
                  {integrationSaving ? 'Sycing...' : 'Apply Links'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAgents;
