#! /bin/bash

# https://tmuxcheatsheet.com/

session=$(jq .name package.json)
# replace . by _ in session name
session=${session//./_}

tmux has-session -t $session 2>/dev/null

if [ $? != 0 ]; then
  # Start new session with a name and a first window named
  window_name="editor"

  tmux new-session -d -s $session -n $window_name
  tmux send-keys -t $session:$window_name "nvim ." C-m

  server_name="opencode"
  tmux new-window -n $server_name
  tmux send-keys -t $session:$server_name 'opencode' C-m

  server_name="pi"
  tmux new-window -n $server_name
  tmux send-keys -t $session:$server_name 'pi' C-m

  server_name="Server"
  tmux new-window -n $server_name
  tmux send-keys -t $session:$server_name 'pnpm run dev' C-m

  git_window="Git"
  tmux new-window -n $git_window
  tmux send-keys -t $session:$git_window "lazygit" C-m

  git_window="workmux"
  tmux new-window -n $git_window
  tmux send-keys -t $session:$git_window "wm sidebar && wm dashboard" C-m

  tmux select-window -t $session:$window_name
fi

tmux attach-session -t $session
