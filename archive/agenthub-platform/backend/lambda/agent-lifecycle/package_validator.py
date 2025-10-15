"""
Advanced Agent Package Validation System
Comprehensive validation for agent packages with detailed analysis and reporting
"""

import json
import zipfile
import io
import ast
import re
import hashlib
import tempfile
import subprocess
import os
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime
from dataclasses import dataclass, field
from pathlib import Path

from data_models import ValidationResult
from validation_engine import ValidationEngine


@dataclass
class PackageStructure:
    """Represents the structure of an agent package"""
    total_files: int = 0
    python_files: List[str] = field(default_factory=list)
    config_files: List[str] = field(default_factory=list)
    documentation_files: List[str] = field(default_factory=list)
    test_files: List[str] = field(default_factory=list)
    data_files: List[str] = field(default_factory=list)
    other_files: List[str] = field(default_factory=list)
    total_size: int = 0
    compressed_size: int = 0


@dataclass
class CodeAnalysis:
    """Results of code analysis"""
    total_lines: int = 0
    code_lines: int = 0
    comment_lines: int = 0
    blank_lines: int = 0
    functions: int = 0
    classes: int = 0
    imports: Set[str] = field(default_factory=set)
    complexity_score: int = 0
    docstring_coverage: float = 0.0
    test_coverage_estimate: float = 0.0


@dataclass
class SecurityAnalysis:
    """Results of security analysis"""
    critical_issues: List[Dict[str, Any]] = field(default_factory=list)
    high_issues: List[Dict[str, Any]] = field(default_factory=list)
    medium_issues: List[Dict[str, Any]] = field(default_factory=list)
    low_issues: List[Dict[str, Any]] = field(default_factory=list)
    total_issues: int = 0
    security_score: float = 100.0


@dataclass
class DependencyAnalysis:
    """Results of dependency analysis"""
    total_dependencies: int = 0
    direct_dependencies: List[str] = field(default_factory=list)
    dev_dependencies: List[str] = field(default_factory=list)
    problematic_dependencies: List[Dict[str, str]] = field(default_factory=list)
    version_conflicts: List[Dict[str, str]] = field(default_factory=list)
    license_issues: List[Dict[str, str]] = field(default_factory=list)
    dependency_tree_depth: int = 0


@dataclass
class ComplianceAnalysis:
    """Results of compliance analysis"""
    license_compliance: bool = True
    security_compliance: bool = True
    code_quality_compliance: bool = True
    documentation_compliance: bool = True
    testing_compliance: bool = True
    overall_compliance_score: float = 100.0
    compliance_issues: List[str] = field(default_factory=list)


class AdvancedPackageValidator:
    """Advanced package validation with comprehensive analysis"""
    
    def __init__(self):
        self.base_validator = ValidationEngine()
        self.max_file_size = 10 * 1024 * 1024  # 10MB per file
        self.max_total_files = 1000
        self.supported_python_versions = ['3.8', '3.9', '3.10', '3.11', '3.12']
        
        # Compliance thresholds
        self.min_docstring_coverage = 0.7
        self.max_complexity_per_function = 10
        self.min_test_coverage = 0.6
        
        # Security patterns (enhanced)
        self.security_patterns = self._load_enhanced_security_patterns()
        
        # Known vulnerable packages
        self.vulnerable_packages = self._load_vulnerable_packages()
    
    def validate_package_comprehensive(self, package_content: bytes, agent_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive package validation"""
        validation_start = datetime.utcnow()
        
        try:
            # Initialize results
            results = {
                'validation_id': hashlib.sha256(package_content).hexdigest()[:16],
                'timestamp': validation_start.isoformat(),
                'package_size': len(package_content),
                'validation_status': 'in_progress'
            }
            
            # 1. Basic structure validation
            structure_analysis = self._analyze_package_structure(package_content)
            results['structure_analysis'] = structure_analysis
            
            # 2. Code analysis
            code_analysis = self._analyze_code_quality(package_content)
            results['code_analysis'] = code_analysis
            
            # 3. Security analysis
            security_analysis = self._analyze_security(package_content)
            results['security_analysis'] = security_analysis
            
            # 4. Dependency analysis
            dependency_analysis = self._analyze_dependencies(package_content)
            results['dependency_analysis'] = dependency_analysis
            
            # 5. Compliance analysis
            compliance_analysis = self._analyze_compliance(
                structure_analysis, code_analysis, security_analysis, dependency_analysis
            )
            results['compliance_analysis'] = compliance_analysis
            
            # 6. Performance analysis
            performance_analysis = self._analyze_performance_characteristics(package_content)
            results['performance_analysis'] = performance_analysis
            
            # 7. Generate overall assessment
            overall_assessment = self._generate_overall_assessment(results)
            results['overall_assessment'] = overall_assessment
            
            # 8. Generate recommendations
            recommendations = self._generate_detailed_recommendations(results)
            results['recommendations'] = recommendations
            
            # Calculate validation duration
            validation_end = datetime.utcnow()
            results['validation_duration_ms'] = int((validation_end - validation_start).total_seconds() * 1000)
            results['validation_status'] = 'completed'
            
            return results
            
        except Exception as e:
            return {
                'validation_id': hashlib.sha256(package_content).hexdigest()[:16],
                'timestamp': validation_start.isoformat(),
                'validation_status': 'failed',
                'error': str(e),
                'validation_duration_ms': int((datetime.utcnow() - validation_start).total_seconds() * 1000)
            }
    
    def _analyze_package_structure(self, package_content: bytes) -> PackageStructure:
        """Analyze package structure and organization"""
        structure = PackageStructure()
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                file_list = zip_file.namelist()
                structure.total_files = len([f for f in file_list if not f.endswith('/')])
                structure.compressed_size = len(package_content)
                
                # Calculate uncompressed size
                for file_info in zip_file.filelist:
                    if not file_info.filename.endswith('/'):
                        structure.total_size += file_info.file_size
                
                # Categorize files
                for file_path in file_list:
                    if file_path.endswith('/'):
                        continue
                    
                    file_lower = file_path.lower()
                    
                    if file_path.endswith('.py'):
                        structure.python_files.append(file_path)
                    elif file_path.endswith(('.yaml', '.yml', '.json', '.cfg', '.ini', '.toml')):
                        structure.config_files.append(file_path)
                    elif file_path.endswith(('.md', '.rst', '.txt')) or 'readme' in file_lower or 'doc' in file_lower:
                        structure.documentation_files.append(file_path)
                    elif 'test' in file_lower or file_path.startswith('tests/'):
                        structure.test_files.append(file_path)
                    elif file_path.endswith(('.csv', '.json', '.xml', '.data')):
                        structure.data_files.append(file_path)
                    else:
                        structure.other_files.append(file_path)
        
        except Exception as e:
            print(f"Error analyzing package structure: {e}")
        
        return structure
    
    def _analyze_code_quality(self, package_content: bytes) -> CodeAnalysis:
        """Analyze code quality metrics"""
        analysis = CodeAnalysis()
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                functions_with_docstrings = 0
                total_functions = 0
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Line counting
                            lines = content.split('\n')
                            analysis.total_lines += len(lines)
                            
                            for line in lines:
                                stripped = line.strip()
                                if not stripped:
                                    analysis.blank_lines += 1
                                elif stripped.startswith('#'):
                                    analysis.comment_lines += 1
                                else:
                                    analysis.code_lines += 1
                            
                            # AST analysis
                            try:
                                tree = ast.parse(content)
                                
                                for node in ast.walk(tree):
                                    if isinstance(node, ast.FunctionDef):
                                        analysis.functions += 1
                                        total_functions += 1
                                        
                                        # Check for docstring
                                        if (node.body and isinstance(node.body[0], ast.Expr) and 
                                            isinstance(node.body[0].value, (ast.Str, ast.Constant))):
                                            functions_with_docstrings += 1
                                        
                                        # Calculate complexity (simplified)
                                        complexity = self._calculate_function_complexity(node)
                                        analysis.complexity_score += complexity
                                    
                                    elif isinstance(node, ast.ClassDef):
                                        analysis.classes += 1
                                    
                                    elif isinstance(node, (ast.Import, ast.ImportFrom)):
                                        if isinstance(node, ast.Import):
                                            for alias in node.names:
                                                analysis.imports.add(alias.name)
                                        else:
                                            if node.module:
                                                analysis.imports.add(node.module)
                            
                            except SyntaxError:
                                pass  # Skip files with syntax errors
                    
                    except Exception:
                        pass  # Skip files that can't be read
                
                # Calculate docstring coverage
                if total_functions > 0:
                    analysis.docstring_coverage = functions_with_docstrings / total_functions
                
                # Estimate test coverage based on test files
                test_files = [f for f in python_files if 'test' in f.lower()]
                if python_files:
                    analysis.test_coverage_estimate = len(test_files) / len(python_files)
        
        except Exception as e:
            print(f"Error analyzing code quality: {e}")
        
        return analysis
    
    def _analyze_security(self, package_content: bytes) -> SecurityAnalysis:
        """Perform comprehensive security analysis"""
        analysis = SecurityAnalysis()
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Scan for security patterns
                            security_issues = self._scan_security_patterns(content, python_file)
                            
                            for issue in security_issues:
                                if issue['severity'] == 'critical':
                                    analysis.critical_issues.append(issue)
                                elif issue['severity'] == 'high':
                                    analysis.high_issues.append(issue)
                                elif issue['severity'] == 'medium':
                                    analysis.medium_issues.append(issue)
                                else:
                                    analysis.low_issues.append(issue)
                    
                    except Exception:
                        pass
                
                # Calculate total issues and security score
                analysis.total_issues = (len(analysis.critical_issues) + len(analysis.high_issues) + 
                                       len(analysis.medium_issues) + len(analysis.low_issues))
                
                # Security score calculation
                score_deduction = (len(analysis.critical_issues) * 25 + 
                                 len(analysis.high_issues) * 10 + 
                                 len(analysis.medium_issues) * 5 + 
                                 len(analysis.low_issues) * 1)
                
                analysis.security_score = max(0, 100 - score_deduction)
        
        except Exception as e:
            print(f"Error analyzing security: {e}")
        
        return analysis
    
    def _analyze_dependencies(self, package_content: bytes) -> DependencyAnalysis:
        """Analyze package dependencies"""
        analysis = DependencyAnalysis()
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                # Analyze requirements.txt
                if 'requirements.txt' in zip_file.namelist():
                    with zip_file.open('requirements.txt') as f:
                        requirements_content = f.read().decode('utf-8')
                        
                        dependencies = []
                        for line in requirements_content.split('\n'):
                            line = line.strip()
                            if line and not line.startswith('#'):
                                dependencies.append(line)
                        
                        analysis.direct_dependencies = dependencies
                        analysis.total_dependencies = len(dependencies)
                        
                        # Check for problematic dependencies
                        analysis.problematic_dependencies = self._check_problematic_dependencies(dependencies)
                        
                        # Check for vulnerable packages
                        vulnerable_deps = self._check_vulnerable_dependencies(dependencies)
                        analysis.problematic_dependencies.extend(vulnerable_deps)
                        
                        # Analyze version conflicts
                        analysis.version_conflicts = self._detect_version_conflicts(dependencies)
                
                # Check for dev dependencies in other files
                dev_files = ['requirements-dev.txt', 'dev-requirements.txt', 'test-requirements.txt']
                for dev_file in dev_files:
                    if dev_file in zip_file.namelist():
                        with zip_file.open(dev_file) as f:
                            dev_content = f.read().decode('utf-8')
                            dev_deps = [line.strip() for line in dev_content.split('\n') 
                                       if line.strip() and not line.startswith('#')]
                            analysis.dev_dependencies.extend(dev_deps)
        
        except Exception as e:
            print(f"Error analyzing dependencies: {e}")
        
        return analysis
    
    def _analyze_compliance(self, structure: PackageStructure, code: CodeAnalysis, 
                          security: SecurityAnalysis, dependencies: DependencyAnalysis) -> ComplianceAnalysis:
        """Analyze compliance with best practices"""
        analysis = ComplianceAnalysis()
        
        try:
            # License compliance
            has_license = any('license' in f.lower() for f in structure.documentation_files)
            analysis.license_compliance = has_license
            if not has_license:
                analysis.compliance_issues.append("Missing license file")
            
            # Security compliance
            analysis.security_compliance = security.security_score >= 80
            if not analysis.security_compliance:
                analysis.compliance_issues.append(f"Security score too low: {security.security_score}")
            
            # Code quality compliance
            quality_issues = []
            if code.docstring_coverage < self.min_docstring_coverage:
                quality_issues.append(f"Low docstring coverage: {code.docstring_coverage:.2f}")
            
            if code.functions > 0 and code.complexity_score / code.functions > self.max_complexity_per_function:
                quality_issues.append(f"High average complexity: {code.complexity_score / code.functions:.2f}")
            
            analysis.code_quality_compliance = len(quality_issues) == 0
            analysis.compliance_issues.extend(quality_issues)
            
            # Documentation compliance
            has_readme = any('readme' in f.lower() for f in structure.documentation_files)
            analysis.documentation_compliance = has_readme
            if not has_readme:
                analysis.compliance_issues.append("Missing README file")
            
            # Testing compliance
            has_tests = len(structure.test_files) > 0
            analysis.testing_compliance = has_tests
            if not has_tests:
                analysis.compliance_issues.append("No test files found")
            
            # Calculate overall compliance score
            compliance_factors = [
                analysis.license_compliance,
                analysis.security_compliance,
                analysis.code_quality_compliance,
                analysis.documentation_compliance,
                analysis.testing_compliance
            ]
            
            analysis.overall_compliance_score = (sum(compliance_factors) / len(compliance_factors)) * 100
        
        except Exception as e:
            print(f"Error analyzing compliance: {e}")
        
        return analysis
    
    def _analyze_performance_characteristics(self, package_content: bytes) -> Dict[str, Any]:
        """Analyze performance characteristics"""
        characteristics = {
            'estimated_cold_start_time': 0,
            'memory_usage_estimate': 0,
            'cpu_intensive_operations': [],
            'io_operations': [],
            'network_operations': [],
            'performance_score': 100
        }
        
        try:
            with zipfile.ZipFile(io.BytesIO(package_content), 'r') as zip_file:
                python_files = [f for f in zip_file.namelist() if f.endswith('.py')]
                
                # Estimate cold start time based on imports and file size
                import_count = 0
                total_size = sum(zip_file.getinfo(f).file_size for f in python_files)
                
                for python_file in python_files:
                    try:
                        with zip_file.open(python_file) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            
                            # Count imports
                            import_count += content.count('import ')
                            
                            # Detect performance-affecting patterns
                            if any(pattern in content for pattern in ['numpy', 'pandas', 'tensorflow', 'torch']):
                                characteristics['cpu_intensive_operations'].append('Machine Learning libraries')
                            
                            if any(pattern in content for pattern in ['requests', 'urllib', 'http']):
                                characteristics['network_operations'].append('HTTP requests')
                            
                            if any(pattern in content for pattern in ['open(', 'file.read', 'file.write']):
                                characteristics['io_operations'].append('File I/O operations')
                    
                    except Exception:
                        pass
                
                # Estimate cold start time (simplified model)
                base_time = 100  # Base cold start time in ms
                import_penalty = import_count * 10  # 10ms per import
                size_penalty = total_size / 1000  # 1ms per KB
                
                characteristics['estimated_cold_start_time'] = base_time + import_penalty + size_penalty
                
                # Estimate memory usage
                characteristics['memory_usage_estimate'] = max(128, total_size / 1000)  # Minimum 128MB
                
                # Calculate performance score
                score_deductions = 0
                if characteristics['estimated_cold_start_time'] > 5000:  # > 5 seconds
                    score_deductions += 30
                elif characteristics['estimated_cold_start_time'] > 2000:  # > 2 seconds
                    score_deductions += 15
                
                if characteristics['memory_usage_estimate'] > 1024:  # > 1GB
                    score_deductions += 20
                
                characteristics['performance_score'] = max(0, 100 - score_deductions)
        
        except Exception as e:
            print(f"Error analyzing performance: {e}")
        
        return characteristics
    
    def _generate_overall_assessment(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall assessment of the package"""
        assessment = {
            'overall_score': 0,
            'grade': 'F',
            'status': 'rejected',
            'critical_issues': [],
            'blocking_issues': [],
            'warnings': [],
            'recommendations': []
        }
        
        try:
            # Calculate weighted overall score
            weights = {
                'security': 0.3,
                'compliance': 0.25,
                'code_quality': 0.2,
                'performance': 0.15,
                'structure': 0.1
            }
            
            scores = {
                'security': results.get('security_analysis', {}).get('security_score', 0),
                'compliance': results.get('compliance_analysis', {}).get('overall_compliance_score', 0),
                'code_quality': self._calculate_code_quality_score(results.get('code_analysis', {})),
                'performance': results.get('performance_analysis', {}).get('performance_score', 0),
                'structure': self._calculate_structure_score(results.get('structure_analysis', {}))
            }
            
            assessment['overall_score'] = sum(scores[key] * weights[key] for key in weights)
            
            # Determine grade
            if assessment['overall_score'] >= 90:
                assessment['grade'] = 'A'
                assessment['status'] = 'approved'
            elif assessment['overall_score'] >= 80:
                assessment['grade'] = 'B'
                assessment['status'] = 'approved_with_warnings'
            elif assessment['overall_score'] >= 70:
                assessment['grade'] = 'C'
                assessment['status'] = 'conditional_approval'
            elif assessment['overall_score'] >= 60:
                assessment['grade'] = 'D'
                assessment['status'] = 'needs_improvement'
            else:
                assessment['grade'] = 'F'
                assessment['status'] = 'rejected'
            
            # Identify critical and blocking issues
            security_analysis = results.get('security_analysis', {})
            if security_analysis.get('critical_issues'):
                assessment['critical_issues'].extend(security_analysis['critical_issues'])
                assessment['status'] = 'rejected'
            
            if security_analysis.get('high_issues'):
                assessment['blocking_issues'].extend(security_analysis['high_issues'])
            
            # Add compliance issues as warnings
            compliance_analysis = results.get('compliance_analysis', {})
            if compliance_analysis.get('compliance_issues'):
                assessment['warnings'].extend(compliance_analysis['compliance_issues'])
        
        except Exception as e:
            print(f"Error generating overall assessment: {e}")
        
        return assessment
    
    def _generate_detailed_recommendations(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate detailed recommendations for improvement"""
        recommendations = []
        
        try:
            # Security recommendations
            security_analysis = results.get('security_analysis', {})
            if security_analysis.get('critical_issues'):
                recommendations.append({
                    'category': 'security',
                    'priority': 'critical',
                    'title': 'Fix Critical Security Issues',
                    'description': 'Address all critical security vulnerabilities before deployment',
                    'issues_count': len(security_analysis['critical_issues'])
                })
            
            # Code quality recommendations
            code_analysis = results.get('code_analysis', {})
            if code_analysis.get('docstring_coverage', 0) < 0.7:
                recommendations.append({
                    'category': 'code_quality',
                    'priority': 'medium',
                    'title': 'Improve Documentation',
                    'description': f"Add docstrings to functions. Current coverage: {code_analysis.get('docstring_coverage', 0):.2f}",
                    'target': 'Aim for 70%+ docstring coverage'
                })
            
            # Performance recommendations
            performance_analysis = results.get('performance_analysis', {})
            if performance_analysis.get('estimated_cold_start_time', 0) > 2000:
                recommendations.append({
                    'category': 'performance',
                    'priority': 'medium',
                    'title': 'Optimize Cold Start Time',
                    'description': f"Reduce cold start time from {performance_analysis.get('estimated_cold_start_time', 0)}ms",
                    'suggestions': ['Reduce number of imports', 'Use lazy loading', 'Optimize package size']
                })
            
            # Dependency recommendations
            dependency_analysis = results.get('dependency_analysis', {})
            if dependency_analysis.get('problematic_dependencies'):
                recommendations.append({
                    'category': 'dependencies',
                    'priority': 'high',
                    'title': 'Review Problematic Dependencies',
                    'description': 'Some dependencies may cause issues',
                    'problematic_count': len(dependency_analysis['problematic_dependencies'])
                })
        
        except Exception as e:
            print(f"Error generating recommendations: {e}")
        
        return recommendations
    
    # Helper methods
    def _load_enhanced_security_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load enhanced security patterns"""
        patterns = {
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
            'pickle_usage': {
                'pattern': r'\bpickle\.(loads?|dumps?)\s*\(',
                'severity': 'high',
                'description': 'Pickle can execute arbitrary code during deserialization'
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
            },
            'path_traversal': {
                'pattern': r'open\s*\([^)]*\.\./[^)]*\)',
                'severity': 'medium',
                'description': 'Potential path traversal vulnerability'
            },
            'weak_random': {
                'pattern': r'\brandom\.(random|randint|choice)\s*\(',
                'severity': 'low',
                'description': 'Use of weak random number generator for security purposes'
            }
        }
        return patterns
    
    def _load_vulnerable_packages(self) -> Dict[str, str]:
        """Load known vulnerable packages"""
        return {
            'pyyaml': 'Versions < 5.1 have arbitrary code execution vulnerability',
            'pillow': 'Some versions have image processing vulnerabilities',
            'requests': 'Versions < 2.20.0 have various security issues',
            'urllib3': 'Some versions have certificate validation issues',
            'jinja2': 'Versions < 2.11.3 have XSS vulnerabilities'
        }
    
    def _calculate_function_complexity(self, node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function"""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, (ast.And, ast.Or)):
                complexity += 1
        
        return complexity
    
    def _scan_security_patterns(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """Scan content for security patterns"""
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
    
    def _check_problematic_dependencies(self, dependencies: List[str]) -> List[Dict[str, str]]:
        """Check for problematic dependencies"""
        problematic = []
        
        problematic_packages = {
            'tensorflow': 'Large package that may cause deployment issues',
            'torch': 'Large package that may cause deployment issues',
            'opencv-python': 'Large package with system dependencies',
            'pandas': 'Large package that may increase cold start time',
            'numpy': 'May cause issues if version conflicts with system numpy',
            'pillow': 'May have system dependencies',
            'lxml': 'May have system dependencies',
            'scipy': 'Large scientific computing package',
            'matplotlib': 'Large plotting library with many dependencies'
        }
        
        for dep in dependencies:
            package_name = dep.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
            
            if package_name.lower() in problematic_packages:
                problematic.append({
                    'name': package_name,
                    'reason': problematic_packages[package_name.lower()],
                    'type': 'size_concern'
                })
        
        return problematic
    
    def _check_vulnerable_dependencies(self, dependencies: List[str]) -> List[Dict[str, str]]:
        """Check for vulnerable dependencies"""
        vulnerable = []
        
        for dep in dependencies:
            package_name = dep.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip()
            
            if package_name.lower() in self.vulnerable_packages:
                vulnerable.append({
                    'name': package_name,
                    'reason': self.vulnerable_packages[package_name.lower()],
                    'type': 'security_vulnerability'
                })
        
        return vulnerable
    
    def _detect_version_conflicts(self, dependencies: List[str]) -> List[Dict[str, str]]:
        """Detect potential version conflicts"""
        conflicts = []
        
        # This is a simplified version - in practice, you'd use a proper dependency resolver
        package_versions = {}
        
        for dep in dependencies:
            if '==' in dep:
                package, version = dep.split('==', 1)
                if package in package_versions and package_versions[package] != version:
                    conflicts.append({
                        'package': package,
                        'conflict': f"Multiple versions specified: {package_versions[package]} and {version}"
                    })
                package_versions[package] = version
        
        return conflicts
    
    def _calculate_code_quality_score(self, code_analysis: Dict[str, Any]) -> float:
        """Calculate code quality score"""
        score = 100.0
        
        # Deduct for low docstring coverage
        docstring_coverage = code_analysis.get('docstring_coverage', 0)
        if docstring_coverage < 0.7:
            score -= (0.7 - docstring_coverage) * 50
        
        # Deduct for high complexity
        functions = code_analysis.get('functions', 1)
        complexity = code_analysis.get('complexity_score', 0)
        if functions > 0:
            avg_complexity = complexity / functions
            if avg_complexity > 10:
                score -= (avg_complexity - 10) * 5
        
        # Deduct for no tests
        test_coverage = code_analysis.get('test_coverage_estimate', 0)
        if test_coverage == 0:
            score -= 20
        
        return max(0, score)
    
    def _calculate_structure_score(self, structure_analysis: Dict[str, Any]) -> float:
        """Calculate structure score"""
        score = 100.0
        
        # Check for required files
        if not structure_analysis.get('python_files'):
            score -= 50
        
        if not structure_analysis.get('config_files'):
            score -= 10
        
        if not structure_analysis.get('documentation_files'):
            score -= 15
        
        # Check file organization
        total_files = structure_analysis.get('total_files', 0)
        if total_files > 100:
            score -= 10  # Too many files
        
        return max(0, score)