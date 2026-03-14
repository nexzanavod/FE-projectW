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
} from 'react-icons/md';
import { getAiAgentsByUserId, createAiAgent, updateAiAgent, deleteAiAgent } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { AiAgent } from '../../types/api.types';

const AiAgents: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    agentTitle: '',
    instructions: '',
    isActive: false,
  });

  useEffect(() => {
    if (user) fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await getAiAgentsByUserId(user.id);
    if (result.success && result.data) {
      setAgents(result.data);
    } else {
      setError(result.message || 'Failed to fetch AI agents');
    }
    setLoading(false);
  };

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

  const handleToggleStatus = async (agent: AiAgent) => {
    const result = await updateAiAgent(agent.id, { isActive: !agent.isActive });
    if (result.success) {
      await fetchAgents();
    } else {
      setError(result.message || 'Failed to update agent status');
    }
  };

  const isFormValid = formData.name.trim() && formData.agentTitle.trim() && formData.instructions.trim();

  return (
    <div className="ai-agents-page">
      {/* Page Header */}
      <div className="ai-agents-header">
        <div className="header-content">
          <div>
            <h1>AI Agents</h1>
            <p>Create and manage AI-powered WhatsApp response agents</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={fetchAgents} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Agent
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

      {/* Stats */}
      <div className="ai-agents-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <MdSmartToy />
          </div>
          <div className="stat-info">
            <h3>{agents.length}</h3>
            <p>Total Agents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{agents.filter(a => a.isActive).length}</h3>
            <p>Active Agents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon muted">
            <MdPauseCircle />
          </div>
          <div className="stat-info">
            <h3>{agents.filter(a => !a.isActive).length}</h3>
            <p>Inactive Agents</p>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="ai-agents-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <MdSmartToy className="empty-icon" />
            <h3>No AI agents yet</h3>
            <p>Create your first AI agent to start handling WhatsApp conversations intelligently</p>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Your First Agent
            </button>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-identity">
                  <div className="agent-avatar">
                    <MdSmartToy />
                  </div>
                  <div className="agent-title-group">
                    <h3>{agent.name}</h3>
                    <span className="agent-role">{agent.agentTitle}</span>
                  </div>
                  <span className={`status-badge ${agent.isActive ? 'active' : 'inactive'}`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="agent-actions">
                  <button className="icon-btn" onClick={() => handleOpenModal(agent)} title="Edit agent">
                    <MdEdit />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(agent.id)} title="Delete agent">
                    <MdDelete />
                  </button>
                </div>
              </div>

              <div className="agent-card-body">
                <div className="instructions-preview">
                  <label>Instructions</label>
                  <p>{agent.instructions}</p>
                </div>
                <div className="agent-meta">
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Last Updated:</span>
                    <span className="meta-value">{new Date(agent.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="agent-card-footer">
                <button
                  className={`toggle-btn ${agent.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleStatus(agent)}
                >
                  {agent.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              {/* Agent Name */}
              <div className="form-group">
                <label htmlFor="agentName">Agent Name *</label>
                <input
                  type="text"
                  id="agentName"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sara"
                  className="form-input"
                />
                <small className="form-help">The name your agent will use when responding</small>
              </div>

              {/* Agent Title */}
              <div className="form-group">
                <label htmlFor="agentTitle">Agent Title *</label>
                <input
                  type="text"
                  id="agentTitle"
                  value={formData.agentTitle}
                  onChange={e => setFormData({ ...formData, agentTitle: e.target.value })}
                  placeholder="e.g., Customer Support Agent"
                  className="form-input"
                />
                <small className="form-help">The role or title of this agent</small>
              </div>

              {/* Instructions */}
              <div className="form-group">
                <label htmlFor="agentInstructions">Instructions *</label>
                <textarea
                  id="agentInstructions"
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g., Help customers with orders and questions. Be friendly and reply in the same language the customer uses."
                  className="form-textarea"
                  rows={6}
                />
                <small className="form-help">
                  Tell the agent how to behave, what topics to handle, and how to respond
                </small>
                <div className="character-count">{formData.instructions.length} characters</div>
              </div>

              {/* Status */}
              <div className="form-group">
                <label htmlFor="agentStatus">Status</label>
                <select
                  id="agentStatus"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <small className="form-help">
                  ⚠️ Only one agent should be active at a time for best results.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal} disabled={saving}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={!isFormValid || saving}
              >
                <MdSave />
                {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAgents;
