-- Create playground_settings table for per-user playground layout preferences
CREATE TABLE IF NOT EXISTS playground_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    layout_mode TEXT DEFAULT 'stacked',
    editor_panel_size INTEGER DEFAULT 62,
    output_panel_size INTEGER DEFAULT 38,
    font_size INTEGER DEFAULT 14,
    font_family TEXT DEFAULT 'JetBrains Mono',
    tab_size INTEGER DEFAULT 4,
    show_minimap BOOLEAN DEFAULT 0,
    show_line_numbers BOOLEAN DEFAULT 1,
    word_wrap TEXT DEFAULT 'off',
    show_whitespace TEXT DEFAULT 'selection',
    last_language_id INTEGER DEFAULT 71,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_playground_settings_user_id ON playground_settings(user_id);
