from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ---- Add project root to sys.path so app.* imports work ----
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ---- Import settings and Base ----
from app.core.config import settings
from app.db.base_class import Base

# ---- Import ALL models so Alembic sees them for autogenerate ----
from app.models.user import User  # noqa
from app.models.problem import Problem  # noqa
from app.models.progress import Progress, UserProgress  # noqa
from app.models.roadmap import Roadmap  # noqa
from app.models.refresh_token import RefreshToken  # noqa
from app.models.leetcode_sync import LeetCodeSync  # noqa
from app.db.models_tutor import Conversation, TutorMessage  # noqa
from app.db.models_tutor import Roadmap as TutorRoadmap  # noqa

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url from settings (so .env drives everything)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")

    # SQLite needs render_as_batch for ALTER TABLE support
    render_as_batch = url.startswith("sqlite")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=render_as_batch,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = config.get_main_option("sqlalchemy.url")

    # SQLite needs render_as_batch for ALTER TABLE support
    render_as_batch = url.startswith("sqlite")

    # Handle SQLite connect_args
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=render_as_batch,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
