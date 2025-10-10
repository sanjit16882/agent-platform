"""
Agent Validation Engine
Comprehensive validation for agent packages, metadata, and configurations
"""

import json
import zipfile
import io
import re
import ast
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import asdict
from data_models import ValidationResult, AgentMetadata
from metadata_manager import MetadataManager, ConfigurationManager


class ValidationEngine:
    """Comprehensive agent validation engine"""
    
    def __init__(self):
        self.metadata_manager = MetadataManager()
        self.config_manager = ConfigurationManager()
        self.max_package_size = 50 * 1024 * 1024  # 50MB
        self.allowed_file_extensions = {
            '.py', '.txt', '.md', '.yml', '.yaml', '.json', '.cfg', '.ini',
            '.requirements', '.dockerfile', '.sh', '.bat'
        }
        self.required_files = ['agent.py', 'requirements.txt']
        self.security_patterns = self._load_security_patterns()
    
    def validate_agent_package(self, package_content: bytes, agent_metadata: Dict[str, Any]) -> ValidationResult:
        """Comprehensive agent package validation"""
        errors = []
        warnings = []
        validation_metadata = {}
        
        try:
            # Basic package validation
            basic_validation = self._validate_package_structure(package_content)
            if not basic_validation.valid:
                return basic_validation
            
            errors.extend(basic_validation.errors)
            warnings.extend(basic_validation.warnings)
            validation_metadata.update(basic_validation.metadata)
            
            # Security validation
            security_validation = self._validate_package_security(package_content)
            if not security_validation.valid:
                errors.extend([f"Security: {error}" for error in security_validation.errors])
            warnings.extend([f"Security: {warning}" for warning in security_validation.warnings])
            validation_metadata.update(security_validation.metadata)
            
            # Code quality validation
            quality_validation = self._validate_code_quality(package_content)
            warnings.extend([f"Code Quality: {warning}" for warning in quality_validation.warnings])
            validation_metadata.update(quality_validation.metadata)
            
            # Dependency validation
            dependency_validation = self._validate_dependencies(package_content)
            if not dependency_validation.valid:
                errors.extend([f"Dependencies: {error}" for error in dependency_validation.errors])
            warnings.extend([f"Dependencies: {warning}" for warning in dependency_validation.warnings])
            validation_metadata.update(dependency_validation.metadata)
            
            # Metadata consistency validation
            metadata_validation = self._validate_metadata_consistency(package_content, agent_metadata)
            if not metadata_validation.valid:
                errors.extend([f"Metadata: {error}" for error in metadata_validation.errors])
            warnings.extend([f"Metadata: {warning}" for warning in metadata_validation.warnings])
            
            # Performance validation
            performance_validation = self._validate_performance_characteristics(package_content)
            warnings.extend([f"Performance: {warning}" for warning in performance_validation.warnings])
            validation_metadata.update(performance_validation.metadata)
            
            return ValidationResult(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                metadata=validation_metadata
            )
            
        except Exception as e:
            return ValidationResult(
                valid=False,
                errors=[f"Package validation failed: {str(e)}"],
                warnings=warnings,
                metadata=validation_metadata
            )
    
    def _validate_package_structure(self, package_content: bytes) -> ValidationResult:
        """Validate basic package structure and format"""
        errors = []
        warnings = []
        metadata = {}
        
        try:
            # Check package size
            if len(package_content) > self.max_package_size:
                errors.append(f"Package size ({len(package_content)} bytes) exceeds maximum allowed size ({self.max_package_size} bytes)")
            
            # Validate ZIP format
            try:
                with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                    file_list = zip_file.namelist()
                    metadata['file_count'] = len(file_list)
                    metadata['total_size'] = len(package_content)
                    
                    # Check for required files
                    missing_files = []
                    for required_file in self.required_files:
                        if required_file not in file_list:
                            missing_files.append(required_file)
                    
                    if missing_files:
                        errors.extend([f"Missing required file: {file}" for file in missing_files])
                    
                    # Check file extensions
                    invalid_files = []
                    for file_path in file_list:
                        if file_path.endswith('/'):  # Skip directories
                            continue
                        
                        file_ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
                        if file_ext not in self.allowed_file_extensions:
                            invalid_files.append(file_path)
                    
                    if invalid_files:
                        warnings.extend([f"Potentially unsafe file: {file}" for file in invalid_files[:5]])
                        if len(invalid_files) > 5:
                            warnings.append(f"... and {len(invalid_files) - 5} more unsafe files")
                    
                    # Check for configuration files
                    config_files = [f for f in file_list if f.endswith(('.yaml', '.yml', '.json', '.cfg', '.ini'))]
                    if not config_files:
                        warnings.append("No configuration files found. Consider adding agent configuration.")
                    
                    metadata['config_files'] = config_files
                    metadata['python_files'] = [f for f in file_list if f.endswith('.py')]
                    
            except zipfile.BadZipFile:
                errors.append("Invalid ZIP file format")
            
        except Exception as e:
            errors.append(f"Package structure validation error: {str(e)}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            metadata=metadata
        )
    
    def _validate_package_security(self, package_content: bytes) -> ValidationResult:
        """Validate package for security vulnerabilities"""
        errors = []
        warnings = []
        metadata = {'security_issues': []}
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Check for security patterns
                            security_issues = self._scan_code_security(content, python_file)
                            if security_issues:
                                metadata['security_issues'].extend(security_issues)
                                
                                # Categorize issues
                                critical_issues = [issue for issue in security_issues if issue['severity'] == 'critical']
                                high_issues = [issue for issue in security_issues if issue['severity'] == 'high']
                                medium_issues = [issue for issue in security_issues if issue['severity'] == 'medium']
                                
                                if critical_issues:
                                    errors.extend([f"Critical security issue in {python_file}: {issue['description']}" 
                                                 for issue in critical_issues])
                                
                                if high_issues:
                                    errors.extend([f"High security risk in {python_file}: {issue['description']}" 
                                                 for issue in high_issues])
                                
                                if medium_issues:
                                    warnings.extend([f"Security concern in {python_file}: {issue['description']}" 
                                                   for issue in medium_issues])
                    
                    except Exception as e:
                        warnings.append(f"Could not scan {python_file} for security issues: {str(e)}")
        
        except Exception as e:
            warnings.append(f"Security validation error: {str(e)}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            metadata=metadata
        )
    
    def _validate_code_quality(self, package_content: bytes) -> ValidationResult:
        """Validate code quality and best practices"""
        errors = []
        warnings = []
        metadata = {'quality_metrics': {}}
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                total_lines = 0
                total_functions = 0
                total_classes = 0
                files_with_docstrings = 0
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Basic metrics
                            lines = content.split('\n')
                            total_lines += len(lines)
                            
                            # Parse AST for more detailed analysis
                            try:
                                tree = ast.parse(content)
                                
                                # Count functions and classes
                                for node in ast.walk(tree):
                                    if isinstance(node, ast.FunctionDef):
                                        total_functions += 1
                                        # Check for docstrings
                                        if (node.body and isinstance(node.body[0], ast.Expr) and 
                                            isinstance(node.body[0].value, ast.Str)):
                                            files_with_docstrings += 1
                                    elif isinstance(node, ast.ClassDef):
                                        total_classes += 1
                                
                                # Check for module-level docstring
                                if (tree.body and isinstance(tree.body[0], ast.Expr) and 
                                    isinstance(tree.body[0].value, ast.Str)):
                                    files_with_docstrings += 1
                                
                            except SyntaxError:
                                warnings.append(f"Syntax error in {python_file}")
                            
                            # Check for common issues
                            if 'print(' in content:
                                warnings.append(f"Debug print statements found in {python_file}")
                            
                            if len(lines) > 1000:
                                warnings.append(f"Large file {python_file} ({len(lines)} lines) - consider splitting")
                    
                    except Exception as e:
                        warnings.append(f"Could not analyze {python_file}: {str(e)}")
                
                # Calculate quality metrics
                metadata['quality_metrics'] = {
                    'total_lines': total_lines,
                    'total_functions': total_functions,
                    'total_classes': total_classes,
                    'files_with_docstrings': files_with_docstrings,
                    'total_python_files': len(python_files)
                }
                
                # Quality warnings
                if total_functions > 0 and files_with_docstrings / total_functions < 0.5:
                    warnings.append("Less than 50% of functions have docstrings")
                
                if total_lines > 5000:
                    warnings.append(f"Large codebase ({total_lines} lines) - ensure proper organization")
        
        except Exception as e:
            warnings.append(f"Code quality validation error: {str(e)}")
        
        return ValidationResult(
            valid=True,  # Quality issues are warnings, not errors
            errors=errors,
            warnings=warnings,
            metadata=metadata
        )
    
    def _validate_dependencies(self, package_content: bytes) -> ValidationResult:
        """Validate package dependencies"""
        errors = []
        warnings = []
        metadata = {'dependencies': [], 'dependency_analysis': {}}
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                # Check requirements.txt
                if 'requirements.txt' in zip_file.namelist():
                    with zip_file.open('requirements.txt') as f:
                        requirements_content = f.read().decode('utf-8')
                        dependencies = [line.strip() for line in requirements_content.split('\n') 
                                      if line.strip() and not line.startswith('#')]
                        
                        metadata['dependencies'] = dependencies
                        
                        # Validate dependency format
                        invalid_deps = []
                        for dep in dependencies:
                            if not self._is_valid_dependency_format(dep):
                                invalid_deps.append(dep)
                        
                        if invalid_deps:
                            errors.extend([f"Invalid dependency format: {dep}" for dep in invalid_deps])
                        
                        # Check for known problematic dependencies
                        problematic_deps = self._check_problematic_dependencies(dependencies)
                        if problematic_deps:
                            warnings.extend([f"Potentially problematic dependency: {dep['name']} - {dep['reason']}" 
                                           for dep in problematic_deps])
                        
                        # Analyze dependency complexity
                        metadata['dependency_analysis'] = {
                            'total_dependencies': len(dependencies),
                            'has_version_pins': sum(1 for dep in dependencies if any(op in dep for op in ['==', '>=', '<=', '>', '<'])),
                            'problematic_count': len(problematic_deps)
                        }
                        
                        if len(dependencies) > 50:
                            warnings.append(f"Large number of dependencies ({len(dependencies)}) may increase deployment time")
                
                else:
                    errors.append("Missing requirements.txt file")
        
        except Exception as e:
            errors.append(f"Dependency validation error: {str(e)}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            metadata=metadata
        )
    
    def _validate_metadata_consistency(self, package_content: bytes, agent_metadata: Dict[str, Any]) -> ValidationResult:
        """Validate consistency between package content and metadata"""
        errors = []
        warnings = []
        
        try:
            # Extract metadata from package
            extracted_metadata, extraction_result = self.metadata_manager.create_metadata_from_package(package_content)
            
            if not extraction_result.valid:
                warnings.extend([f"Metadata extraction: {warning}" for warning in extraction_result.warnings])
            
            # Compare declared vs detected frameworks
            declared_frameworks = set(agent_metadata.get('frameworks', []))
            detected_frameworks = set(extracted_metadata.frameworks)
            
            missing_frameworks = detected_frameworks - declared_frameworks
            if missing_frameworks:
                warnings.extend([f"Detected framework not declared in metadata: {fw}" for fw in missing_frameworks])
            
            extra_frameworks = declared_frameworks - detected_frameworks
            if extra_frameworks:
                warnings.extend([f"Declared framework not detected in code: {fw}" for fw in extra_frameworks])
            
            # Compare dependencies
            declared_deps = set(agent_metadata.get('dependencies', []))
            detected_deps = set(extracted_metadata.dependencies)
            
            if declared_deps != detected_deps:
                warnings.append("Declared dependencies don't match requirements.txt")
        
        except Exception as e:
            warnings.append(f"Metadata consistency validation error: {str(e)}")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_performance_characteristics(self, package_content: bytes) -> ValidationResult:
        """Validate performance characteristics of the agent"""
        errors = []
        warnings = []
        metadata = {'performance_indicators': {}}
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                performance_indicators = {
                    'has_async_code': False,
                    'has_threading': False,
                    'has_multiprocessing': False,
                    'has_database_operations': False,
                    'has_network_operations': False,
                    'has_file_operations': False,
                    'complexity_score': 0
                }
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Check for performance-related patterns
                            if 'async def' in content or 'await ' in content:
                                performance_indicators['has_async_code'] = True
                            
                            if 'threading' in content or 'Thread(' in content:
                                performance_indicators['has_threading'] = True
                            
                            if 'multiprocessing' in content or 'Process(' in content:
                                performance_indicators['has_multiprocessing'] = True
                            
                            if any(db in content for db in ['sqlite3', 'psycopg2', 'pymongo', 'sqlalchemy']):
                                performance_indicators['has_database_operations'] = True
                            
                            if any(net in content for net in ['requests', 'urllib', 'http.client', 'aiohttp']):
                                performance_indicators['has_network_operations'] = True
                            
                            if any(file_op in content for file_op in ['open(', 'with open', 'file.read', 'file.write']):
                                performance_indicators['has_file_operations'] = True
                            
                            # Simple complexity estimation
                            complexity_indicators = content.count('for ') + content.count('while ') + content.count('if ')
                            performance_indicators['complexity_score'] += complexity_indicators
                    
                    except Exception:
                        pass  # Skip files that can't be read
                
                metadata['performance_indicators'] = performance_indicators
                
                # Performance warnings
                if performance_indicators['complexity_score'] > 100:
                    warnings.append("High code complexity detected - consider optimization")
                
                if performance_indicators['has_database_operations'] and not performance_indicators['has_async_code']:
                    warnings.append("Database operations detected - consider using async patterns for better performance")
                
                if performance_indicators['has_network_operations'] and not performance_indicators['has_async_code']:
                    warnings.append("Network operations detected - consider using async patterns for better performance")
        
        except Exception as e:
            warnings.append(f"Performance validation error: {str(e)}")
        
        return ValidationResult(
            valid=True,  # Performance issues are warnings
            errors=errors,
            warnings=warnings,
            metadata=metadata
        )
    
    def _load_security_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load security patterns for code scanning"""
        return {
            'eval_usage': {
                'pattern': r'\beval\s*\(',
                'severity': 'critical',
                'description': 'Use of eval() function can execute arbitrary code'
            },
            'exec_usage': {
                'pattern': r'\bexec\s*\(',
                'severity': 'critical',
                'description': 'Use of exec() function can execute arbitrary code'
            },
            'subprocess_shell': {
                'pattern': r'subprocess\.[^(]*\([^)]*shell\s*=\s*True',
                'severity': 'high',
                'description': 'Subprocess with shell=True can be vulnerable to injection'
            },
            'os_system': {
                'pattern': r'\bos\.system\s*\(',
                'severity': 'high',
                'description': 'Use of os.system() can be vulnerable to command injection'
            },
            'hardcoded_password': {
                'pattern': r'password\s*=\s*["\'][^"\']{8,}["\']',
                'severity': 'medium',
                'description': 'Potential hardcoded password detected'
            },
            'hardcoded_key': {
                'pattern': r'(api_key|secret_key|access_key)\s*=\s*["\'][^"\']{10,}["\']',
                'severity': 'medium',
                'description': 'Potential hardcoded API key detected'
            },
            'sql_injection_risk': {
                'pattern': r'(execute|query)\s*\([^)]*%[^)]*\)',
                'severity': 'medium',
                'description': 'Potential SQL injection vulnerability'
            }
        }
    
    def _scan_code_security(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Scan code content for security issues"""
        issues = []
        
        for pattern_name, pattern_info in self.security_patterns.items():
            matches = re.finditer(pattern_info['pattern'], content, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                line_number = content[:match.start()].count('\n') + 1
                issues.append({
                    'type': pattern_name,
                    'severity': pattern_info['severity'],
                    'description': pattern_info['description'],
                    'file': filename,
                    'line': line_number,
                    'match': match.group()
                })
        
        return issues
    
    def _is_valid_dependency_format(self, dependency: str) -> bool:
        """Check if dependency string has valid format"""
        # Basic pattern for Python package names with optional version specifiers
        pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?([<>=!~]+[0-9.]+.*)?$'
        return bool(re.match(pattern, dependency.strip()))
    
    def _check_problematic_dependencies(self, dependencies: List[str]) -> List[Dict[str, str]]:
        """Check for known problematic dependencies"""
        problematic = []
        
        # Known problematic packages
        problematic_packages = {
            'tensorflow': 'Large package that may cause deployment issues',
            'torch': 'Large package that may cause deployment issues',
            'opencv-python': 'Large package with system dependencies',
            'pandas': 'Large package that may increase cold start time',
            'numpy': 'May cause issues if version conflicts with system numpy',
            'pillow': 'May have system dependencies',
            'lxml': 'May have system dependencies'
        }
        
        for dep in dependencies:
            package_name = dep.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
            
            if package_name.lower() in problematic_packages:
                problematic.append({
                    'name': package_name,
                    'reason': problematic_packages[package_name.lower()]
                })
        
        return problematic
    
    def generate_validation_report(self, validation_result: ValidationResult, agent_id: str) -> Dict[str, Any]:
        """Generate a comprehensive validation report"""
        report = {
            'agent_id': agent_id,
            'validation_timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'passed' if validation_result.valid else 'failed',
            'summary': {
                'total_errors': len(validation_result.errors),
                'total_warnings': len(validation_result.warnings),
                'validation_score': self._calculate_validation_score(validation_result)
            },
            'errors': validation_result.errors,
            'warnings': validation_result.warnings,
            'metadata': validation_result.metadata,
            'recommendations': self._generate_recommendations(validation_result)
        }
        
        return report
    
    def _calculate_validation_score(self, validation_result: ValidationResult) -> float:
        """Calculate a validation score (0-100)"""
        base_score = 100.0
        
        # Deduct points for errors and warnings
        error_penalty = len(validation_result.errors) * 10
        warning_penalty = len(validation_result.warnings) * 2
        
        score = max(0, base_score - error_penalty - warning_penalty)
        return round(score, 2)
    
    def _generate_recommendations(self, validation_result: ValidationResult) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        if validation_result.errors:
            recommendations.append("Fix all validation errors before deployment")
        
        if len(validation_result.warnings) > 10:
            recommendations.append("Consider addressing validation warnings to improve code quality")
        
        # Check metadata for specific recommendations
        metadata = validation_result.metadata
        
        if 'security_issues' in metadata and metadata['security_issues']:
            recommendations.append("Review and fix security issues before deployment")
        
        if 'quality_metrics' in metadata:
            quality = metadata['quality_metrics']
            if quality.get('files_with_docstrings', 0) < quality.get('total_functions', 1) * 0.5:
                recommendations.append("Add docstrings to improve code documentation")
        
        if 'dependency_analysis' in metadata:
            dep_analysis = metadata['dependency_analysis']
            if dep_analysis.get('total_dependencies', 0) > 30:
                recommendations.append("Consider reducing the number of dependencies")
        
        if 'performance_indicators' in metadata:
            perf = metadata['performance_indicators']
            if perf.get('complexity_score', 0) > 50:
                recommendations.append("Consider refactoring to reduce code complexity")
        
        return recommendations