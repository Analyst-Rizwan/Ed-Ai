"""add github oauth fields

Revision ID: 4d37bae96d81
Revises: 54a38afe4f37
Create Date: 2026-03-08 15:38:43.401464

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d37bae96d81'
down_revision: Union[str, Sequence[str], None] = '54a38afe4f37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('github_access_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('github_username', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'github_username')
    op.drop_column('users', 'github_access_token')
