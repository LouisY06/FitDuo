"""add round wins tracking

Revision ID: add_round_wins
Revises: 5372338d8fcb
Create Date: 2025-11-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_round_wins'
down_revision = '5372338d8fcb'
branch_labels = None
depends_on = None


def upgrade():
    # Add player_a_rounds_won and player_b_rounds_won columns
    op.add_column('gamesession', sa.Column('player_a_rounds_won', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('gamesession', sa.Column('player_b_rounds_won', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    # Remove the columns
    op.drop_column('gamesession', 'player_b_rounds_won')
    op.drop_column('gamesession', 'player_a_rounds_won')

