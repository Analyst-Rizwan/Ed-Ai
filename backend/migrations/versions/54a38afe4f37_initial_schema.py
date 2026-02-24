"""initial_schema

Revision ID: 54a38afe4f37
Revises: 
Create Date: 2026-02-18 11:01:09.572634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54a38afe4f37'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables from scratch."""

    # --- users ---
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('role', sa.String(), server_default='user'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('xp', sa.Integer(), server_default=sa.text('0')),
        sa.Column('level', sa.Integer(), server_default=sa.text('1')),
        sa.Column('bio', sa.String(), nullable=True),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('github_url', sa.String(), nullable=True),
        sa.Column('linkedin_url', sa.String(), nullable=True),
        sa.Column('website_url', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # --- problems ---
    op.create_table(
        'problems',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('leetcode_slug', sa.String(), nullable=True),
        sa.Column('acceptance', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('likes', sa.Integer(), server_default=sa.text('0')),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('hints', sa.JSON(), nullable=True),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('test_cases', sa.JSON(), nullable=True),
    )
    op.create_index('ix_problems_id', 'problems', ['id'])
    op.create_index('ix_problems_leetcode_slug', 'problems', ['leetcode_slug'], unique=True)

    # --- roadmaps ---
    op.create_table(
        'roadmaps',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('steps', sa.Text(), nullable=True),
    )
    op.create_index('ix_roadmaps_id', 'roadmaps', ['id'])

    # --- progress (per-problem) ---
    op.create_table(
        'progress',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('problem_id', sa.Integer(), sa.ForeignKey('problems.id'), nullable=False),
        sa.Column('solved', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('attempted', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('last_attempt', sa.DateTime(), nullable=True),
        sa.Column('solution_code', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('time_spent', sa.Integer(), server_default=sa.text('0')),
    )
    op.create_index('ix_progress_id', 'progress', ['id'])
    op.create_index('ix_progress_user_id', 'progress', ['user_id'])
    op.create_index('ix_progress_problem_id', 'progress', ['problem_id'])

    # --- user_progress (aggregated) ---
    op.create_table(
        'user_progress',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('completed_roadmaps', sa.JSON(), nullable=True),
        sa.Column('completed_problems', sa.JSON(), nullable=True),
    )
    op.create_index('ix_user_progress_id', 'user_progress', ['id'])
    op.create_index('ix_user_progress_user_id', 'user_progress', ['user_id'])

    # --- refresh_tokens ---
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('revoked', sa.Boolean(), server_default=sa.text('false')),
    )
    op.create_index('ix_refresh_tokens_id', 'refresh_tokens', ['id'])
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)

    # --- leetcode_syncs ---
    op.create_table(
        'leetcode_syncs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('sync_status', sa.String(), server_default='pending'),
        sa.Column('problems_synced', sa.Integer(), server_default=sa.text('0')),
        sa.Column('sync_started_at', sa.DateTime(), nullable=True),
        sa.Column('sync_completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('sync_data', sa.JSON(), nullable=True),
    )
    op.create_index('ix_leetcode_syncs_id', 'leetcode_syncs', ['id'])
    op.create_index('ix_leetcode_syncs_user_id', 'leetcode_syncs', ['user_id'])

    # --- tutor_conversations ---
    op.create_table(
        'tutor_conversations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_tutor_conversations_id', 'tutor_conversations', ['id'])

    # --- tutor_messages ---
    op.create_table(
        'tutor_messages',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('tutor_conversations.id'), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_tutor_messages_id', 'tutor_messages', ['id'])

    # --- tutor_roadmaps ---
    op.create_table(
        'tutor_roadmaps',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('ordering', sa.Integer(), server_default=sa.text('0')),
    )
    op.create_index('ix_tutor_roadmaps_id', 'tutor_roadmaps', ['id'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('tutor_roadmaps')
    op.drop_table('tutor_messages')
    op.drop_table('tutor_conversations')
    op.drop_table('leetcode_syncs')
    op.drop_table('refresh_tokens')
    op.drop_table('user_progress')
    op.drop_table('progress')
    op.drop_table('roadmaps')
    op.drop_table('problems')
    op.drop_table('users')
