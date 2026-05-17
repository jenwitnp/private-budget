#!/bin/bash

# backup-restore.sh
# Simple backup and restore utilities for local Supabase
# Usage: ./backup-restore.sh backup
#        ./backup-restore.sh restore /path/to/backup.sql

set -e

COMMAND=${1:-"help"}
BACKUP_DIR="/tmp/supabase_backups"
mkdir -p "$BACKUP_DIR"

LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_USER="postgres"
LOCAL_DB="postgres"

show_help() {
  echo "Supabase Backup & Restore Utility"
  echo "==================================="
  echo ""
  echo "Usage:"
  echo "  $0 backup              - Create full backup of local database"
  echo "  $0 restore <file>      - Restore from backup file"
  echo "  $0 list                - List all available backups"
  echo "  $0 clean               - Remove backups older than 7 days"
  echo ""
  echo "Backups stored in: $BACKUP_DIR"
}

backup() {
  echo "💾 Creating backup..."
  BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
  
  PGPASSWORD=postgres pg_dump \
    -h "$LOCAL_HOST" \
    -p "$LOCAL_PORT" \
    -U "$LOCAL_USER" \
    -d "$LOCAL_DB" \
    --no-owner \
    --verbose \
    > "$BACKUP_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created: $BACKUP_FILE"
    echo "📊 Size: $SIZE"
  else
    echo "❌ Backup failed"
    exit 1
  fi
}

restore() {
  if [ -z "$1" ]; then
    echo "❌ Error: Please provide backup file path"
    echo "Usage: $0 restore /path/to/backup.sql"
    exit 1
  fi
  
  if [ ! -f "$1" ]; then
    echo "❌ Error: Backup file not found: $1"
    exit 1
  fi
  
  echo "⚠️  WARNING: This will REPLACE your local database"
  read -p "Type 'CONFIRM' to proceed: " confirm
  if [ "$confirm" != "CONFIRM" ]; then
    echo "❌ Cancelled"
    exit 1
  fi
  
  echo "🔄 Restoring from backup..."
  PGPASSWORD=postgres psql \
    -h "$LOCAL_HOST" \
    -p "$LOCAL_PORT" \
    -U "$LOCAL_USER" \
    -d "$LOCAL_DB" \
    -f "$1"
  
  if [ $? -eq 0 ]; then
    echo "✅ Restore complete"
  else
    echo "❌ Restore failed"
    exit 1
  fi
}

list_backups() {
  echo "📂 Available backups:"
  echo ""
  ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null || echo "No backups found"
  echo ""
  echo "💡 Tip: Use 'backup' command to create a new backup"
}

clean_old() {
  echo "🧹 Removing backups older than 7 days..."
  
  DELETE_COUNT=$(find "$BACKUP_DIR" -name "*.sql" -mtime +7 2>/dev/null | wc -l)
  
  if [ "$DELETE_COUNT" -eq 0 ]; then
    echo "✅ No old backups to remove"
    return
  fi
  
  echo "Found $DELETE_COUNT old backups"
  read -p "Delete them? (yes/no): " -r
  if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    echo "✅ Deleted"
  else
    echo "❌ Cancelled"
  fi
}

case "$COMMAND" in
  backup)
    backup
    ;;
  restore)
    restore "$2"
    ;;
  list)
    list_backups
    ;;
  clean)
    clean_old
    ;;
  *)
    show_help
    ;;
esac
