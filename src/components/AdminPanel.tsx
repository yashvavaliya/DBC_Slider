import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './useradmin/AdminHeader';
import { AdminDashboard } from './useradmin/AdminDashboard';
import { AdminCardList } from './useradmin/AdminCardList';
import { AdminCardEditor } from './useradmin/AdminCardEditor';
import { AnalyticsPage } from './AnalyticsPage';

interface BusinessCard {
  id: string;
  title: string | null;
  company: string | null;
  is_published: boolean;
  view_count: number;
  slug: string | null;
  updated_at: string;
}

type ActiveView = 'dashboard' | 'cards' | 'create' | 'edit' | 'analytics';
  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;

  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const THEMES = [
  {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#D97706',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Rose Pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Dark Mode',
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#1F2937',
    text: '#F9FAFB',
  },
];

const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: '▭' },
  { id: 'rounded', name: 'Rounded', icon: '▢' },
  { id: 'circle', name: 'Circle', icon: '●' },
];

const LAYOUT_STYLES = [
  { id: 'modern', name: 'Modern' },
  { id: 'classic', name: 'Classic' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'creative', name: 'Creative' },
];

const ALIGNMENTS = [
  { id: 'center', name: 'Center' },
  { id: 'left', name: 'Left' },
  { id: 'right', name: 'Right' },
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Open Sans', name: 'Open Sans' },
  { id: 'Poppins', name: 'Poppins' },
  { id: 'Montserrat', name: 'Montserrat' },
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cards' | 'create' | 'edit'>('cards');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserCards();
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (editingCardId) {
      loadCardData(editingCardId);
    } else {
      resetForm();
    }
  }, [editingCardId]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.name || '',
          email: data.email || user.email || '',
          globalUsername: data.global_username || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserCards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading cards:', error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardData = async (cardId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load card data
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (cardError) {
        console.error('Error loading card:', cardError);
        setMessage({ type: 'error', text: 'Failed to load card data' });
        return;
      }

      // Parse theme and layout
      const theme = typeof cardData.theme === 'object' ? cardData.theme : THEMES[0];
      const layout = typeof cardData.layout === 'object' ? cardData.layout : {
        style: 'modern',
        alignment: 'center',
        font: 'Inter',
      };

      setFormData({
        title: cardData.title || '',
        username: cardData.slug || '',
        globalUsername: formData.globalUsername,
        company: cardData.company || '',
        tagline: cardData.bio || '',
        profession: cardData.position || '',
        avatar_url: cardData.avatar_url || '',
        phone: cardData.phone || '',
        whatsapp: cardData.whatsapp || '',
        email: cardData.email || '',
        website: cardData.website || '',
        address: cardData.address || '',
        map_link: cardData.map_link || '',
        theme: theme as any,
        shape: cardData.shape || 'rectangle',
        layout: layout as any,
        is_published: cardData.is_published || false,
      });

      // Load social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (socialError) {
        console.error('Error loading social links:', socialError);
      } else {
        setSocialLinks(socialData || []);
      }

    } catch (error) {
      console.error('Error loading card data:', error);
      setMessage({ type: 'error', text: 'Failed to load card data' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      username: '',
      globalUsername: formData.globalUsername,
      company: '',
      tagline: '',
      profession: '',
      avatar_url: '',
      phone: '',
      whatsapp: '',
      email: user?.email || '',
      website: '',
      address: '',
      map_link: '',
      theme: THEMES[0],
      shape: 'rectangle',
      layout: {
        style: 'modern',
        alignment: 'center',
        font: 'Inter',
      },
      is_published: false,
    });
          {activeTab === 'analytics' && <AnalyticsPage />}
          
    setSocialLinks([]);
    setMediaItems([]);
    setReviews([]);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
          .select()
        if (error) {
          console.error('Error creating card:', error);
          setMessage({ type: 'error', text: 'Failed to create card' });
          return;
        }

        cardId = data.id;
        setEditingCardId(cardId);
        setMessage({ type: 'success', text: 'Card created successfully!' });
      }

      // Update global username in profile if changed
      if (formData.globalUsername !== '') {
        await supabase
          .from('profiles')
          .update({ 
            global_username: formData.globalUsername.trim() || null,
            name: formData.title.trim()
          })
          .eq('id', user.id);

      // Reload cards
      await loadUserCards();

    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
  const handleCancelEdit = () => {
    setActiveView('cards');
    setEditingCardId(null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addSocialLink = () => {
    const newLink: Partial<SocialLink> = {
      id: `temp-${Date.now()}`,
      platform: 'Instagram',
      username: '',
      url: '',
      display_order: socialLinks.length,
      is_active: true,
    };
    setSocialLinks([...socialLinks, newLink as SocialLink]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };

    // Auto-generate URL for supported platforms
    if (field === 'username' || field === 'platform') {
      const link = updatedLinks[index];
      if (link.platform && link.username) {
        link.url = generateSocialLink(link.platform, link.username);
      }
    }

    setSocialLinks(updatedLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const saveSocialLinks = async () => {
    if (!editingCardId) return;

    try {
      // Delete existing links
      await supabase
        .from('social_links')
        .delete()
        .eq('card_id', editingCardId);

      // Insert new links
      const linksToInsert = socialLinks
        .filter(link => link.platform && link.url)
        .map((link, index) => ({
          card_id: editingCardId,
          platform: link.platform,
          username: link.username || null,
          url: link.url,
          display_order: index,
          is_active: true,
        }));

      if (linksToInsert.length > 0) {
        const { error } = await supabase
          .from('social_links')
          .insert(linksToInsert);

        if (error) {
          console.error('Error saving social links:', error);
          setMessage({ type: 'error', text: 'Failed to save social links' });
          return;
        }
      }

      setMessage({ type: 'success', text: 'Social links saved successfully!' });
    } catch (error) {
      console.error('Error saving social links:', error);
      setMessage({ type: 'error', text: 'Failed to save social links' });
    }
  };

  const handleAutoSyncSocials = async () => {
    if (!formData.globalUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a global username first' });
      return;
    }

    const autoSyncedLinks = generateAutoSyncedLinks(formData.globalUsername);
    
    // Convert to the format expected by our component
    const newSocialLinks: SocialLink[] = autoSyncedLinks.map((link, index) => ({
      id: `auto-${Date.now()}-${index}`,
      card_id: editingCardId || '',
      platform: link.platform,
      username: link.username,
      url: link.url,
      display_order: socialLinks.length + index,
      is_active: true,
      is_auto_synced: link.is_auto_synced,
      created_at: new Date().toISOString(),
    }));

    setSocialLinks([...socialLinks, ...newSocialLinks]);
    setMessage({ type: 'success', text: `Added ${newSocialLinks.length} social links!` });
  };

  const handleCreateCard = () => {
    setEditingCardId(null);
    setActiveTab('create');
    resetForm();
  };

  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId);
    setActiveTab('edit');
  };

  if (loading && activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cards...</p>
        </div>
      </div>
    );
  }

  // Calculate dashboard stats
  const dashboardStats = {
    totalCards: cards.length,
    publishedCards: cards.filter(card => card.is_published).length,
    totalViews: cards.reduce((sum, card) => sum + (card.view_count || 0), 0),
    recentCards: cards.slice(0, 5)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        onCreateCard={handleCreateCard}
        onEditCard={handleEditCard}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-sm">
            <AdminSidebar
              onCreateCard={handleCreateCard}
              onEditCard={handleEditCard}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <AdminHeader
          activeTab={activeView}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Message */}
        {message && (
          <div className={`mx-4 lg:mx-8 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}fhrthtrh
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {activeTab === 'cards' && (
            <div className="space-y-6">
              {/* Cards Grid */}
              {cards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => (
                    <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {card.title || 'Untitled Card'}
                            </h3>
                            {card.company && (
                              <p className="text-sm text-gray-600">{card.company}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              card.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {card.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {card.view_count || 0} rererg
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCard(card.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          {card.is_published && card.slug && (
                            <button
                              onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                              View
                            </button>
                          )}
                          <button
                            onClick={() => copyCardLink(card.slug)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
                  <p className="text-gray-600 mb-6">Create your first digital business card to get started.</p>
                  <button
                    onClick={handleCreateCard}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Card
                  </button>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'create' || activeTab === 'edit') && (
            <AdminCardEditor
              cardId={editingCardId}
              onSave={handleSaveCard}
              onCancel={handleCancelEdit}
            />
                    </button>

                    {expandedSections.media && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <MediaUpload
                          cardId={editingCardId}
                          mediaItems={mediaItems}
                          onMediaChange={setMediaItems}
                          userId={user?.id || ''}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {editingCardId && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleSection('reviews')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-gray-900">Reviews</h3>
                      </div>
                      {expandedSections.reviews ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.reviews && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <ReviewsManager
                          cardId={editingCardId}
                          reviews={reviews}
                          onReviewsChange={setReviews}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Design & Layout */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleSection('design')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold text-gray-900">Design & Layout</h3>
                    </div>
                    {expandedSections.design ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.design && (
                    <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                      {/* Theme Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {THEMES.map((theme) => (
                            <button
                              key={theme.name}
                              onClick={() => handleThemeChange(theme)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                formData.theme.name === theme.name
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: theme.primary }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full"
            <AdminDashboard stats={dashboardStats} />
          )}
        </main>
      </div>
            <AdminCardList
              cards={cards}
              onCreateCard={handleCreateCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              loading={loading}
            />