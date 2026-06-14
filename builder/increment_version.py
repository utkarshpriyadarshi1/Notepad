import os
import sys
import json
import re

def bump_version(current_version, bump_type):
    parts = list(map(int, current_version.split('.')))
    if len(parts) != 3:
        raise ValueError(f"Invalid semver version: {current_version}")
    
    if bump_type == 'major':
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    elif bump_type == 'minor':
        parts[1] += 1
        parts[2] = 0
    else: # patch
        parts[2] += 1
        
    return ".".join(map(str, parts))

def main():
    bump_type = 'patch'
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['major', 'minor', 'patch']:
            bump_type = arg

    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    package_path = os.path.join(root_dir, 'frontend', 'package.json')
    config_path = os.path.join(root_dir, 'app.config.json')
    
    if not os.path.exists(package_path):
        print(f"❌ package.json not found at {package_path}")
        sys.exit(1)
        
    # Read package.json
    with open(package_path, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
        
    current_version = package_data.get('version', '1.0.0')
    new_version = bump_version(current_version, bump_type)
    
    # Update package.json
    package_data['version'] = new_version
    with open(package_path, 'w', encoding='utf-8') as f:
        json.dump(package_data, f, indent=2)
    
    try:
        print(f"[VERSION] Bumped version in frontend/package.json: {current_version} -> {new_version}")
    except UnicodeEncodeError:
        print(f"[VERSION] Bumped version in frontend/package.json: {current_version} -> {new_version}")
    
    # Update app.config.json if it exists
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        config_data['appVersion'] = new_version
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
        try:
            print(f"[VERSION] Bumped version in app.config.json: {current_version} -> {new_version}")
        except UnicodeEncodeError:
            print(f"[VERSION] Bumped version in app.config.json: {current_version} -> {new_version}")
    else:
        try:
            print(f"[WARNING] app.config.json not found at {config_path}, skipping configuration update.")
        except UnicodeEncodeError:
            print(f"[WARNING] app.config.json not found at {config_path}, skipping configuration update.")

if __name__ == '__main__':
    main()
