"""
Agent Package Validation Service
Orchestrates comprehensive validation workflows
"""

import json
import boto3
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import asdict

from package_validator import AdvancedPackageValidator
from validation_engine import ValidationEngine
from metadata_manager import MetadataManager
from data_models import ValidationResult


class ValidationService:
    """Service for orchestrating agent package validation"""
    
    def __init__(self, storage_bucket: str):
        self.storage_bucket = storage_bucket
        self.s3_client = boto3.client('s3')
        self.dynamodb = boto3.resource('dynamodb')
        
        # Initialize validators
        self.advanced_validator = AdvancedPackageValidator()
        self.base_validator = ValidationEngine()
        self.metadata_manager = MetadataManager()
        
        # Validation cache (in production, use Redis or DynamoDB)
        self.validation_cache = {}
        self.cache_ttl = timedelta(hours=24)
    
    def validate_agent_package_full(self, agent_id: str, package_content: bytes, 
                                  agent_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Perform full validation of an agent package"""
        
        # Generate validation ID
        package_hash = hashlib.sha256(package_content).hexdigest()
        validation_id = f"{agent_id}_{package_hash[:16]}"
        
        # Check cache first
        cached_result = self._get_cached_validation(validation_id)
        if cached_result:
            return cached_result
        
        validation_start = datetime.utcnow()
        
        try:
            # 1. Basic validation using existing ValidationEngine
            basic_validation = self.base_validator.validate_agent_package(package_content, agent_metadata)
            
            # 2. Advanced validation using AdvancedPackageValidator
            advanced_validation = self.advanced_validator.validate_package_comprehensive(
                package_content, agent_metadata
            )
            
            # 3. Metadata validation
            metadata_validation = self._validate_metadata_consistency(package_content, agent_metadata)
            
            # 4. Combine results
            combined_results = self._combine_validation_results(
                validation_id, basic_validation, advanced_validation, metadata_validation
            )
            
            # 5. Generate final assessment
            final_assessment = self._generate_final_assessment(combined_results)
            combined_results['final_assessment'] = final_assessment
            
            # 6. Store validation results
            self._store_validation_results(agent_id, validation_id, combined_results)
            
            # 7. Cache results
            self._cache_validation_results(validation_id, combined_results)
            
            # 8. Calculate validation duration
            validation_end = datetime.utcnow()
            combined_results['validation_duration_ms'] = int(
                (validation_end - validation_start).total_seconds() * 1000
            )
            
            return combined_results
            
        except Exception as e:
            error_result = {
                'validation_id': validation_id,
                'agent_id': agent_id,
                'timestamp': validation_start.isoformat(),
                'status': 'error',
                'error': str(e),
                'validation_duration_ms': int(
                    (datetime.utcnow() - validation_start).total_seconds() * 1000
                )
            }
            
            # Store error result
            self._store_validation_results(agent_id, validation_id, error_result)
            
            return error_result
    
    def get_validation_history(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get validation history for an agent"""
        try:
            # List validation reports from S3
            prefix = f"agents/{agent_id}/validations/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.storage_bucket,
                Prefix=prefix,
                MaxKeys=limit
            )
            
            validation_history = []
            
            if 'Contents' in response:
                # Sort by last modified (most recent first)
                objects = sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True)
                
                for obj in objects[:limit]:
                    try:
                        # Get validation report
                        report_response = self.s3_client.get_object(
                            Bucket=self.storage_bucket,
                            Key=obj['Key']
                        )
                        
                        report_content = report_response['Body'].read().decode('utf-8')
                        validation_report = json.loads(report_content)
                        
                        # Add summary info
                        summary = {
                            'validation_id': validation_report.get('validation_id'),
                            'timestamp': validation_report.get('timestamp'),
                            'status': validation_report.get('final_assessment', {}).get('status', 'unknown'),
                            'overall_score': validation_report.get('final_assessment', {}).get('overall_score', 0),
                            'grade': validation_report.get('final_assessment', {}).get('grade', 'F'),
                            'critical_issues': len(validation_report.get('final_assessment', {}).get('critical_issues', [])),
                            'total_warnings': len(validation_report.get('final_assessment', {}).get('warnings', []))
                        }
                        
                        validation_history.append(summary)
                        
                    except Exception as e:
                        print(f"Error reading validation report {obj['Key']}: {e}")
                        continue
            
            return validation_history
            
        except Exception as e:
            print(f"Error getting validation history: {e}")
            return []
    
    def get_validation_report(self, agent_id: str, validation_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed validation report"""
        try:
            report_key = f"agents/{agent_id}/validations/{validation_id}.json"
            
            response = self.s3_client.get_object(
                Bucket=self.storage_bucket,
                Key=report_key
            )
            
            report_content = response['Body'].read().decode('utf-8')
            return json.loads(report_content)
            
        except self.s3_client.exceptions.NoSuchKey:
            return None
        except Exception as e:
            print(f"Error getting validation report: {e}")
            return None
    
    def revalidate_agent(self, agent_id: str, package_content: bytes, 
                        agent_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Force revalidation of an agent package"""
        
        # Clear any cached results
        package_hash = hashlib.sha256(package_content).hexdigest()
        validation_id = f"{agent_id}_{package_hash[:16]}"
        
        if validation_id in self.validation_cache:
            del self.validation_cache[validation_id]
        
        # Perform fresh validation
        return self.validate_agent_package_full(agent_id, package_content, agent_metadata)
    
    def get_validation_statistics(self, time_period_days: int = 30) -> Dict[str, Any]:
        """Get validation statistics for the specified time period"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)
            
            # This is a simplified version - in production, you'd query a database
            # For now, we'll return mock statistics
            stats = {
                'time_period_days': time_period_days,
                'total_validations': 156,
                'successful_validations': 134,
                'failed_validations': 22,
                'success_rate': 85.9,
                'average_validation_time_ms': 2340,
                'validation_trends': {
                    'security_issues': {
                        'critical': 3,
                        'high': 12,
                        'medium': 28,
                        'low': 45
                    },
                    'common_issues': [
                        {'issue': 'Missing docstrings', 'count': 67},
                        {'issue': 'Large dependencies', 'count': 34},
                        {'issue': 'No test files', 'count': 23},
                        {'issue': 'Hardcoded credentials', 'count': 8}
                    ],
                    'grade_distribution': {
                        'A': 23,
                        'B': 45,
                        'C': 34,
                        'D': 32,
                        'F': 22
                    }
                }
            }
            
            return stats
            
        except Exception as e:
            print(f"Error getting validation statistics: {e}")
            return {}
    
    def _validate_metadata_consistency(self, package_content: bytes, 
                                     agent_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Validate metadata consistency"""
        try:
            # Extract metadata from package
            extracted_metadata, extraction_result = self.metadata_manager.create_metadata_from_package(
                package_content
            )
            
            consistency_results = {
                'metadata_extraction_success': extraction_result.valid,
                'extraction_errors': extraction_result.errors,
                'extraction_warnings': extraction_result.warnings,
                'consistency_issues': [],
                'consistency_score': 100.0
            }
            
            # Compare declared vs extracted metadata
            declared_frameworks = set(agent_metadata.get('frameworks', []))
            extracted_frameworks = set(extracted_metadata.frameworks)
            
            # Check framework consistency
            missing_frameworks = extracted_frameworks - declared_frameworks
            extra_frameworks = declared_frameworks - extracted_frameworks
            
            if missing_frameworks:
                consistency_results['consistency_issues'].append({
                    'type': 'missing_frameworks',
                    'description': f"Detected frameworks not declared: {', '.join(missing_frameworks)}",
                    'severity': 'medium'
                })
                consistency_results['consistency_score'] -= 10
            
            if extra_frameworks:
                consistency_results['consistency_issues'].append({
                    'type': 'extra_frameworks',
                    'description': f"Declared frameworks not detected: {', '.join(extra_frameworks)}",
                    'severity': 'low'
                })
                consistency_results['consistency_score'] -= 5
            
            # Check dependency consistency
            declared_deps = set(agent_metadata.get('dependencies', []))
            extracted_deps = set(extracted_metadata.dependencies)
            
            if declared_deps != extracted_deps:
                consistency_results['consistency_issues'].append({
                    'type': 'dependency_mismatch',
                    'description': "Declared dependencies don't match requirements.txt",
                    'severity': 'medium'
                })
                consistency_results['consistency_score'] -= 15
            
            return consistency_results
            
        except Exception as e:
            return {
                'metadata_extraction_success': False,
                'extraction_errors': [str(e)],
                'consistency_issues': [],
                'consistency_score': 0.0
            }
    
    def _combine_validation_results(self, validation_id: str, basic_validation: ValidationResult,
                                  advanced_validation: Dict[str, Any], 
                                  metadata_validation: Dict[str, Any]) -> Dict[str, Any]:
        """Combine results from different validation stages"""
        
        combined = {
            'validation_id': validation_id,
            'timestamp': datetime.utcnow().isoformat(),
            'validation_stages': {
                'basic_validation': {
                    'valid': basic_validation.valid,
                    'errors': basic_validation.errors,
                    'warnings': basic_validation.warnings,
                    'metadata': basic_validation.metadata
                },
                'advanced_validation': advanced_validation,
                'metadata_validation': metadata_validation
            }
        }
        
        return combined
    
    def _generate_final_assessment(self, combined_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate final assessment from combined validation results"""
        
        assessment = {
            'overall_score': 0.0,
            'grade': 'F',
            'status': 'rejected',
            'critical_issues': [],
            'blocking_issues': [],
            'warnings': [],
            'recommendations': [],
            'approval_status': 'rejected',
            'deployment_ready': False
        }
        
        try:
            # Get scores from different validation stages
            basic_valid = combined_results['validation_stages']['basic_validation']['valid']
            advanced_results = combined_results['validation_stages']['advanced_validation']
            metadata_results = combined_results['validation_stages']['metadata_validation']
            
            # Calculate weighted overall score
            weights = {
                'basic_validation': 0.2,
                'security': 0.3,
                'code_quality': 0.2,
                'compliance': 0.15,
                'performance': 0.1,
                'metadata_consistency': 0.05
            }
            
            scores = {
                'basic_validation': 100.0 if basic_valid else 0.0,
                'security': advanced_results.get('security_analysis', {}).get('security_score', 0),
                'code_quality': self._extract_code_quality_score(advanced_results),
                'compliance': advanced_results.get('compliance_analysis', {}).get('overall_compliance_score', 0),
                'performance': advanced_results.get('performance_analysis', {}).get('performance_score', 0),
                'metadata_consistency': metadata_results.get('consistency_score', 0)
            }
            
            assessment['overall_score'] = sum(scores[key] * weights[key] for key in weights)
            assessment['score_breakdown'] = scores
            
            # Determine grade and status
            if assessment['overall_score'] >= 90:
                assessment['grade'] = 'A'
                assessment['status'] = 'excellent'
                assessment['approval_status'] = 'approved'
                assessment['deployment_ready'] = True
            elif assessment['overall_score'] >= 80:
                assessment['grade'] = 'B'
                assessment['status'] = 'good'
                assessment['approval_status'] = 'approved'
                assessment['deployment_ready'] = True
            elif assessment['overall_score'] >= 70:
                assessment['grade'] = 'C'
                assessment['status'] = 'acceptable'
                assessment['approval_status'] = 'conditional_approval'
                assessment['deployment_ready'] = True
            elif assessment['overall_score'] >= 60:
                assessment['grade'] = 'D'
                assessment['status'] = 'needs_improvement'
                assessment['approval_status'] = 'needs_improvement'
                assessment['deployment_ready'] = False
            else:
                assessment['grade'] = 'F'
                assessment['status'] = 'poor'
                assessment['approval_status'] = 'rejected'
                assessment['deployment_ready'] = False
            
            # Collect issues from all validation stages
            self._collect_validation_issues(combined_results, assessment)
            
            # Generate recommendations
            assessment['recommendations'] = self._generate_comprehensive_recommendations(
                combined_results, assessment
            )
            
        except Exception as e:
            print(f"Error generating final assessment: {e}")
            assessment['error'] = str(e)
        
        return assessment
    
    def _collect_validation_issues(self, combined_results: Dict[str, Any], 
                                 assessment: Dict[str, Any]) -> None:
        """Collect issues from all validation stages"""
        
        # Basic validation issues
        basic_validation = combined_results['validation_stages']['basic_validation']
        if basic_validation['errors']:
            assessment['critical_issues'].extend(basic_validation['errors'])
        if basic_validation['warnings']:
            assessment['warnings'].extend(basic_validation['warnings'])
        
        # Advanced validation issues
        advanced_validation = combined_results['validation_stages']['advanced_validation']
        
        # Security issues
        security_analysis = advanced_validation.get('security_analysis', {})
        if security_analysis.get('critical_issues'):
            assessment['critical_issues'].extend([
                f"Security: {issue['description']}" for issue in security_analysis['critical_issues']
            ])
        if security_analysis.get('high_issues'):
            assessment['blocking_issues'].extend([
                f"Security: {issue['description']}" for issue in security_analysis['high_issues']
            ])
        
        # Compliance issues
        compliance_analysis = advanced_validation.get('compliance_analysis', {})
        if compliance_analysis.get('compliance_issues'):
            assessment['warnings'].extend([
                f"Compliance: {issue}" for issue in compliance_analysis['compliance_issues']
            ])
        
        # Metadata consistency issues
        metadata_validation = combined_results['validation_stages']['metadata_validation']
        if metadata_validation.get('consistency_issues'):
            assessment['warnings'].extend([
                f"Metadata: {issue['description']}" for issue in metadata_validation['consistency_issues']
            ])
    
    def _generate_comprehensive_recommendations(self, combined_results: Dict[str, Any],
                                             assessment: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate comprehensive recommendations"""
        recommendations = []
        
        try:
            # Critical security recommendations
            if assessment['critical_issues']:
                recommendations.append({
                    'category': 'security',
                    'priority': 'critical',
                    'title': 'Fix Critical Security Issues',
                    'description': 'Address all critical security vulnerabilities before deployment',
                    'action_required': True,
                    'estimated_effort': 'high'
                })
            
            # Code quality recommendations
            advanced_validation = combined_results['validation_stages']['advanced_validation']
            code_analysis = advanced_validation.get('code_analysis', {})
            
            if code_analysis.get('docstring_coverage', 0) < 0.7:
                recommendations.append({
                    'category': 'documentation',
                    'priority': 'medium',
                    'title': 'Improve Code Documentation',
                    'description': f"Current docstring coverage: {code_analysis.get('docstring_coverage', 0):.1%}",
                    'target': 'Aim for 70%+ docstring coverage',
                    'estimated_effort': 'medium'
                })
            
            # Performance recommendations
            performance_analysis = advanced_validation.get('performance_analysis', {})
            if performance_analysis.get('estimated_cold_start_time', 0) > 3000:
                recommendations.append({
                    'category': 'performance',
                    'priority': 'medium',
                    'title': 'Optimize Cold Start Performance',
                    'description': f"Current estimated cold start: {performance_analysis.get('estimated_cold_start_time', 0)}ms",
                    'suggestions': [
                        'Reduce number of imports',
                        'Use lazy loading for heavy libraries',
                        'Optimize package size'
                    ],
                    'estimated_effort': 'medium'
                })
            
            # Dependency recommendations
            dependency_analysis = advanced_validation.get('dependency_analysis', {})
            if dependency_analysis.get('problematic_dependencies'):
                recommendations.append({
                    'category': 'dependencies',
                    'priority': 'low',
                    'title': 'Review Dependencies',
                    'description': f"Found {len(dependency_analysis['problematic_dependencies'])} potentially problematic dependencies",
                    'action_items': [
                        'Review large dependencies for necessity',
                        'Consider lighter alternatives',
                        'Pin dependency versions'
                    ],
                    'estimated_effort': 'low'
                })
            
            # Testing recommendations
            if not advanced_validation.get('structure_analysis', {}).get('test_files'):
                recommendations.append({
                    'category': 'testing',
                    'priority': 'medium',
                    'title': 'Add Test Coverage',
                    'description': 'No test files detected in the package',
                    'suggestions': [
                        'Add unit tests for core functionality',
                        'Include integration tests',
                        'Add test configuration files'
                    ],
                    'estimated_effort': 'high'
                })
        
        except Exception as e:
            print(f"Error generating recommendations: {e}")
        
        return recommendations
    
    def _extract_code_quality_score(self, advanced_results: Dict[str, Any]) -> float:
        """Extract code quality score from advanced validation results"""
        try:
            code_analysis = advanced_results.get('code_analysis', {})
            
            # Calculate score based on various factors
            score = 100.0
            
            # Docstring coverage
            docstring_coverage = code_analysis.get('docstring_coverage', 0)
            if docstring_coverage < 0.7:
                score -= (0.7 - docstring_coverage) * 50
            
            # Test coverage
            test_coverage = code_analysis.get('test_coverage_estimate', 0)
            if test_coverage < 0.3:
                score -= (0.3 - test_coverage) * 100
            
            # Complexity
            functions = code_analysis.get('functions', 1)
            complexity = code_analysis.get('complexity_score', 0)
            if functions > 0:
                avg_complexity = complexity / functions
                if avg_complexity > 10:
                    score -= (avg_complexity - 10) * 5
            
            return max(0, score)
            
        except Exception:
            return 0.0
    
    def _store_validation_results(self, agent_id: str, validation_id: str, 
                                results: Dict[str, Any]) -> None:
        """Store validation results in S3"""
        try:
            report_key = f"agents/{agent_id}/validations/{validation_id}.json"
            
            self.s3_client.put_object(
                Bucket=self.storage_bucket,
                Key=report_key,
                Body=json.dumps(results, indent=2, default=str),
                ContentType='application/json'
            )
            
        except Exception as e:
            print(f"Error storing validation results: {e}")
    
    def _get_cached_validation(self, validation_id: str) -> Optional[Dict[str, Any]]:
        """Get cached validation results"""
        if validation_id in self.validation_cache:
            cached_result, timestamp = self.validation_cache[validation_id]
            
            # Check if cache is still valid
            if datetime.utcnow() - timestamp < self.cache_ttl:
                return cached_result
            else:
                # Remove expired cache entry
                del self.validation_cache[validation_id]
        
        return None
    
    def _cache_validation_results(self, validation_id: str, results: Dict[str, Any]) -> None:
        """Cache validation results"""
        self.validation_cache[validation_id] = (results, datetime.utcnow())